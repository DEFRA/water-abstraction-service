'use strict'

const Decimal = require('decimal.js-light')
const { groupBy, sortBy, negate, flatMap } = require('lodash')

const validators = require('../../../../../lib/models/validators')
const Return = require('../../../../../lib/models/return')
const ReturnLine = require('../../../../../lib/models/return-line')
const PurposeUse = require('../../../../../lib/models/purpose-use')
const DateRange = require('../../../../../lib/models/date-range')
const FinancialYear = require('../../../../../lib/models/financial-year')

const ChargeElementContainer = require('./charge-element-container')

const { ChargeElementMatchingError } = require('../errors')
const decimalHelpers = require('../../../../../lib/decimal-helpers')

const { RETURN_SEASONS } = require('../../../../../lib/models/constants')
const {
  ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD
} = require('../../../../../lib/models/billing-volume').twoPartTariffStatuses

/**
 * Checks whether the charge element purpose matches the supplied purpose use
 * @param {PurposeUse} purposeUse to check
 * @param {ChargeElementContainer} chargeElementContainer
 * @return {Boolean}
 */
const isPurposeUseMatch = (purposeUse, chargeElementContainer) => {
  return chargeElementContainer.chargeElement.purposeUse.id === purposeUse.id
}

const isReturnPurposeUseMatch = (ret, chargeElementContainer) => {
  return ret.purposeUses.some(purposeUse =>
    isPurposeUseMatch(purposeUse, chargeElementContainer)
  )
}

/**
 * Checks if the return line is within the supplied charge period
 * No need to consider:
 * - Daily lines - they will always fall perfectly within a charge period
 * - When the charge period is the full financial year.  In this
 *   case we wish to include all the return lines and don't need to flag
 *
 * @param {DateRange} chargePeriod
 * @param {ReturnLine} returnLine
 * @return {Boolean}
 */
const isReturnLineStraddlingChargePeriodError = (returnLine, chargePeriod) => {
  if (returnLine.isDaily || chargePeriod.isFinancialYear) {
    return false
  }

  // Charge period is not full financial year - indicates possible transfer/variation
  return !returnLine.isWithinDateRange(chargePeriod)
}

/**
 * Gets a key for re-allocating quantities to base elements
 * Re-allocation occurs for elements with the same:
 * - Source factor
 * - Season factor
 * - Purpose use
 * @param {ChargeElementContainer} chargeElementContainer
 * @return {String}
 */
const getReallocationKey = chargeElementContainer => {
  const { source, season, purposeUse: { id } } = chargeElementContainer.chargeElement
  return [source, season, id].join(':')
}

const isTimeLimited = chargeElementContainer => !!chargeElementContainer.chargeElement.timeLimitedPeriod
const isNotTimeLimited = negate(isTimeLimited)

/**
 * Re-allocates as much volume as possible from the source element to the target element
 * @param {ChargeElementContainer} sourceElementContainer
 * @param {ChargeElementContainer} targetElementContainer
 */
const reallocateElement = (returnSeason, sourceElementContainer, targetElementContainer) => {
  const volumeToReallocate = decimalHelpers.min(
    targetElementContainer.getAvailableVolume(),
    sourceElementContainer.getBillingVolume(returnSeason).approvedOrCalculatedVolume
  )
  if (volumeToReallocate.isPositive()) {
    sourceElementContainer.deallocate(returnSeason, volumeToReallocate)
    targetElementContainer.allocate(returnSeason, volumeToReallocate)
  }
}

/**
 * Re-allocates volume within a group of ChargeElementContainers which have
 * already been grouped with matching source, season factor and purpose
 * @param {Array} chargeElementContainers
 */
const reallocateGroup = (returnSeason, chargeElementContainers) => {
  const base = chargeElementContainers.filter(isNotTimeLimited)
  const sub = chargeElementContainers.filter(isTimeLimited)

  base.forEach(baseElement => {
    sub.forEach(subElement => {
      if (subElement.chargeElement.abstractionPeriod.isWithinAbstractionPeriod(baseElement.chargeElement.abstractionPeriod)) {
        reallocateElement(returnSeason, subElement, baseElement)
      }
    })
  })
}

class ChargeElementGroup {
  /**
   * @constructor
   * @param {Array<ChargeElementContainer>} [chargeElementContainers]
   */
  constructor (chargeElementContainers, returnSeason) {
    this._chargeElementContainers = []
    if (chargeElementContainers) {
      this.chargeElementContainers = chargeElementContainers
    }
    if (returnSeason) {
      this.returnSeason = returnSeason
    }
  }

  /**
   * Creates a new ChargeElementGroup with the return season set
   * @param {String} returnSeason
   */
  createForReturnSeason (returnSeason) {
    return new ChargeElementGroup(this._chargeElementContainers, returnSeason)
  }

  /**
   * Sets the return season for the charge element group
   * @param {String}
   */
  set returnSeason (returnSeason) {
    validators.assertEnum(returnSeason, Object.values(RETURN_SEASONS))
    this._returnSeason = returnSeason
  }

  get returnSeason () {
    return this._returnSeason
  }

  /**
   * Sets the charge element containers
   * @param {Array<ChargeElementContainer>} chargeElementContainers
   */
  set chargeElementContainers (chargeElementContainers) {
    validators.assertIsArrayOfType(chargeElementContainers, ChargeElementContainer)
    this._chargeElementContainers = chargeElementContainers
  }

  get chargeElementContainers () {
    return this._chargeElementContainers
  }

  /**
   * Gets the sum of billable/authorised for all charge
   * elements in the group.  This is needed when pro-rating volumes by purpose
   * @return {Decimal}
   */
  get volume () {
    return this._chargeElementContainers.reduce((acc, chargeElementContainer) =>
      acc.plus(new Decimal(chargeElementContainer.chargeElement.volume))
    , new Decimal(0))
  }

  /**
   * Checks whether there are any charge element containers in this group
   * @return {Boolean}
   */
  isEmpty () {
    return this._chargeElementContainers.length === 0
  }

  /**
   * Checks whether this charge element group contains at least one element
   * matching the supplied purpose use
   * @param {PurposeUse} purposeUse
   * @return {Boolean}
   */
  isPurposeUseMatch (purposeUse) {
    validators.assertIsInstanceOf(purposeUse, PurposeUse)
    return this._chargeElementContainers.some(
      chargeElementContainer => isPurposeUseMatch(purposeUse, chargeElementContainer)
    )
  }

  /**
   * Creates a new ChargeElementGroup with only:
   * - a date range which overlaps the charge period
   * @return {ChargeElementGroup}
   */
  createForChargePeriod () {
    const chargeElementContainers = this._chargeElementContainers
      .filter(chargeElementContainer => chargeElementContainer.isValidForChargePeriod)
    return new ChargeElementGroup(chargeElementContainers)
  }

  /**
   * Creates a new ChargeElementGroup with only:
   * - two-part tariff purposes
   * @return {ChargeElementGroup}
   */
  createForTwoPartTariff () {
    const chargeElementContainers = this._chargeElementContainers
      .filter(chargeElementContainer => chargeElementContainer.isTwoPartTariffPurpose)
    return new ChargeElementGroup(chargeElementContainers)
  }

  /**
   * Creates a new ChargeElementGroup containing only elements that are
   * candidates for matching the supplied return based on the purpose uses
   * @param {Return} ret
   * @return {ChargeElementGroup}
   */
  createForReturn (ret) {
    validators.assertIsInstanceOf(ret, Return)

    const returnSeason = ret.isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear

    // Get only elements with purpose uses matching the return purpose
    const elements = this._chargeElementContainers
      .filter(chargeElementContainer => isReturnPurposeUseMatch(ret, chargeElementContainer))

    return new ChargeElementGroup(elements, returnSeason)
  }

  /**
   * Creates new ChargeElementGroups for each purpose that match the supplied
   * return line based on the charge period and abs period
   * @param {ReturnLine} returnLine
   * @param {DateRange} chargePeriod
   * @return {Array<ChargeElementGroup>}
   */
  createForReturnLine (returnLine, chargePeriod) {
    validators.assertIsInstanceOf(returnLine, ReturnLine)
    validators.assertIsInstanceOf(chargePeriod, DateRange)

    // Only consider elements with abs period / time limits that match return line
    const elements = this._chargeElementContainers.filter(
      chargeElementContainer => chargeElementContainer.isReturnLineMatch(returnLine)
    )

    // Throw error if no element matches supplied return line
    if (elements.length === 0) {
      throw new ChargeElementMatchingError(`No charge elements to match for return line ${returnLine.id}`)
    }

    // Rank elements by score
    const { returnSeason } = this
    const sortedElements = sortBy(elements, chargeElementContainer => chargeElementContainer.getScore(returnSeason))

    // Check return line falls in charge period
    if (isReturnLineStraddlingChargePeriodError(returnLine, chargePeriod)) {
      this.setTwoPartTariffStatus(ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD)
    }

    // Group by purpose use
    const groups = groupBy(sortedElements,
      element => element.chargeElement.purposeUse.id
    )

    // Return as array of element groups
    return Object.values(groups).map(
      chargeElementContainers => new ChargeElementGroup(chargeElementContainers, this.returnSeason)
    )
  }

  /**
   * Sets the two part tariff error status code
   * @param {Number} twoPartTariffStatus
   */
  setTwoPartTariffStatus (twoPartTariffStatus) {
    const { returnSeason } = this
    this._chargeElementContainers.forEach(chargeElementContainer =>
      chargeElementContainer.setTwoPartTariffStatus(returnSeason, twoPartTariffStatus)
    )
    return this
  }

  /**
   * Allocate a billable volume to the group
   * @param {Decimal}
   */
  allocate (volume) {
    const { returnSeason } = this
    this._chargeElementContainers.reduce((acc, chargeElementContainer, i) => {
      const isLast = i === this._chargeElementContainers.length - 1
      const qtyToAllocate = isLast
        ? acc
        : decimalHelpers.min(
          chargeElementContainer.getAvailableVolume(),
          acc
        )
      chargeElementContainer.allocate(returnSeason, qtyToAllocate)
      return acc.minus(qtyToAllocate)
    }, new Decimal(volume))
  }

  /**
   * Re-balance quantities from time-limited elements to base
   * elements when they have matching source, season and purpose
   * @return {this}
   */
  reallocate () {
    const { returnSeason } = this
    const groups = groupBy(this._chargeElementContainers, getReallocationKey)
    Object.values(groups).forEach(group => reallocateGroup(returnSeason, group))
    return this
  }

  /**
   * Flags over-abstraction in containers
   * @return {this}
   */
  flagOverAbstraction () {
    const { returnSeason } = this
    this._chargeElementContainers.forEach(
      chargeElementContainer => chargeElementContainer.flagOverAbstraction(returnSeason)
    )
    return this
  }

  /**
   * Sets financial year in BillingVolume models
   * @return {this}
   */
  setFinancialYear (financialYear) {
    validators.assertIsInstanceOf(financialYear, FinancialYear)
    this._chargeElementContainers.forEach(
      chargeElementContainer => chargeElementContainer.setFinancialYear(financialYear)
    )
    return this
  }

  /**
   * Gets an array of billing volumes
   * @return {Array<BillingVolume>}
   */
  toBillingVolumes () {
    const isSummer = this.returnSeason === RETURN_SEASONS.summer
    const billingVolumes = flatMap(this._chargeElementContainers.map(
      chargeElementContainer => chargeElementContainer.billingVolumes
    ))
    return billingVolumes
      .filter(billingVolume => billingVolume.isSummer === isSummer)
      .map(billingVolume => billingVolume.setVolumeFromCalculatedVolume())
  }

  /**
   * Sets any existing billing volumes on the charge element groups,
   * e.g. from summer cycle when processing winter/all year
   * @param {Array<BillingVolume>} billingVolumes
   */
  setBillingVolumes (billingVolumes) {
    for (const billingVolume of billingVolumes) {
      const chargeElementContainer = this._chargeElementContainers.find(c => c.chargeElement.id === billingVolume.chargeElementId)
      chargeElementContainer.setBillingVolume(billingVolume)
    }
    return this
  }
};

module.exports = ChargeElementGroup
