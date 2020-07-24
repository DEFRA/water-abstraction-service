'use strict';

const { groupBy, sortBy, negate } = require('lodash');

const { TIME_PERIODS } = require('../../../../../lib/models/constants');
const validators = require('../../../../../lib/models/validators');
const Return = require('../../../../../lib/models/return');
const ReturnLine = require('../../../../../lib/models/return-line');
const PurposeUse = require('../../../../../lib/models/purpose-use');
const DateRange = require('../../../../../lib/models/date-range');

const ChargeElement = require('../../../../../lib/models/charge-element');
const ChargeElementContainer = require('./charge-element-container');

const { ChargeElementMatchingError } = require('../errors');

const { RETURN_SEASONS } = require('../../../../../lib/models/constants');
const {
  ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD
} = require('../../../../../lib/models/billing-volume').twoPartTariffStatuses;

/**
 * Checks whether the charge element purpose matches the supplied purpose use
 * @param {PurposeUse} purposeUse to check
 * @param {ChargeElementContainer} chargeElementContainer
 * @return {Boolean}
 */
const isPurposeUseMatch = (purposeUse, chargeElementContainer) => {
  return chargeElementContainer.chargeElement.purposeUse.id === purposeUse.id;
};

const isReturnPurposeUseMatch = (ret, chargeElementContainer) => {
  return ret.purposeUses.some(purposeUse =>
    isPurposeUseMatch(purposeUse, chargeElementContainer)
  );
};

/**
 * Checks whether the ChargeElementContainer supplied is for a summer element
 * @param {ChargeElementContainer} chargeElementContainer
 * @return {Boolean}
 */
const isSummerChargeElementContainer = chargeElementContainer => chargeElementContainer.billingVolume.isSummer;

/**
 * Gets a score for sorting charge elements
 * @param {ChargeElementContainer} chargeElementContainer
 * @return {Number}
 */
const getElementSortScore = chargeElementContainer => {
  // Initial score is based on abstraction days.  We try to fill up
  // elements with fewer days first
  let score = chargeElementContainer.abstractionDays;

  // If charge element is a supported source, we give these preference
  const isSupported = chargeElementContainer.chargeElement.source === ChargeElement.sources.supported;
  if (isSupported) {
    score -= 1000;
  }
  return score;
};

/**
 * Checks if the return line is within the supplied charge period
 * @param {DateRange} chargePeriod
 * @param {ReturnLine} returnLine
 * @return {Boolean}
 */
const isReturnLineStraddlingChargePeriodError = (returnLine, chargePeriod) => {
  // No need to consider daily lines - they will fall perfectly within a charge period
  if (returnLine.timePeriod === TIME_PERIODS.day) {
    return false;
  }
  // No need to consider if the charge period is the full financial year.  In this
  // case we wish to include all the return lines and don't need to flag
  if (chargePeriod.startDate.endsWith('-04-01') && chargePeriod.endDate.endsWith('-03-31')) {
    return false;
  }

  // Charge period is not full financial year - indicates possible transfer/variation
  return !returnLine.isWithinDateRange(chargePeriod);
};

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
  const { source, season, purposeUse: { id } } = chargeElementContainer.chargeElement;
  return [source, season, id].join(':');
};

const isTimeLimited = chargeElementContainer => !!chargeElementContainer.chargeElement.timeLimitedPeriod;
const isNotTimeLimited = negate(isTimeLimited);

/**
 * Re-allocates as much volume as possible from the source element to the target element
 * @param {ChargeElementContainer} sourceElementContainer
 * @param {ChargeElementContainer} targetElementContainer
 */
const reallocateElement = (sourceElementContainer, targetElementContainer) => {
  const volumeToReallocate = Math.max(targetElementContainer.getAvailableVolume(), sourceElementContainer.billingVolume.volume);
  if (volumeToReallocate > 0) {
    sourceElementContainer.billingVolume.deallocate(volumeToReallocate);
    targetElementContainer.billingVolume.allocate(volumeToReallocate);
  }
};

/**
 * Re-allocates volume within a group of ChargeElementContainers which have
 * already been grouped with matching source, season factor and purpose
 * @param {Array} chargeElementContainers
 */
const reallocateGroup = chargeElementContainers => {
  const base = chargeElementContainers.filter(isNotTimeLimited);
  const sub = chargeElementContainers.filter(isTimeLimited);
  base.forEach(baseElement => {
    sub.forEach(subElement => {
      if (sub.chargeElement.abstractionPeriod.isWithinAbstractionPeriod(base.chargeElement.abstractionPeriod)) {
        reallocateElement(sub, base);
      }
    });
  });
};

class ChargeElementGroup {
  /**
   * @constructor
   * @param {Array<ChargeElementContainer>} [chargeElementContainers]
   */
  constructor (chargeElementContainers) {
    this._chargeElementContainers = [];
    if (chargeElementContainers) {
      this.chargeElementContainers = chargeElementContainers;
    }
  }

  /**
   * Sets the charge element containers
   * @param {Array<ChargeElementContainer>} chargeElementContainers
   */
  set chargeElementContainers (chargeElementContainers) {
    validators.assertIsArrayOfType(chargeElementContainers, ChargeElementContainer);
    this._chargeElementContainers = chargeElementContainers;
  }

  get chargeElementContainers () {
    return this._chargeElementContainers;
  }

  /**
   * Gets the sum of billable/authorised for all charge
   * elements in the group.  This is needed when pro-rating volumes by purpose
   * @return {Number}
   */
  get volume () {
    return this._chargeElementContainers.reduce((acc, chargeElementContainer) =>
      acc + chargeElementContainer.chargeElement.volume
    , 0);
  }

  /**
   * Checks whether the charge element group contains summer elements
   * @return {Boolean}
   */
  isSummerElements () {
    return this._chargeElementContainers.some(isSummerChargeElementContainer);
  }

  /**
   * Checks whether there are any charge element containers in this group
   * @return {Boolean}
   */
  isEmpty () {
    return this._chargeElementContainers.length === 0;
  }

  /**
   * Checks whether this charge element group contains at least one element
   * matching the supplied purpose use
   * @param {PurposeUse} purposeUse
   * @return {Boolean}
   */
  isPurposeUseMatch (purposeUse) {
    validators.assertIsInstanceOf(purposeUse, PurposeUse);
    return this._chargeElementContainers.some(
      chargeElementContainer => isPurposeUseMatch(purposeUse, chargeElementContainer)
    );
  }

  /**
   * Creates a new ChargeElementGroup with only two-part tariff purposes included
   * @return {ChargeElementGroup}
   */
  createForTwoPartTariff () {
    const chargeElementContainers = this._chargeElementContainers
      .filter(chargeElementContainer => chargeElementContainer.isTwoPartTariffPurpose);
    return new ChargeElementGroup(chargeElementContainers);
  }

  /**
   * Creates a new ChargeElementGroup for the supplied season
   * @param {String} season
   * @return {ChargeElementGroup}
   */
  createForSeason (season) {
    validators.assertEnum(season, Object.values(RETURN_SEASONS));
    // Filter elements that match the supplied season
    const isSummer = season === RETURN_SEASONS.summer;
    const elements = this._chargeElementContainers.filter(chargeElementContainer =>
      chargeElementContainer.isSummer === isSummer
    );
    return new ChargeElementGroup(elements);
  }

  /**
   * Creates a new ChargeElementGroup containing only elements that are
   * candidates for matching the supplied return based on the purpose uses
   * @param {Return} ret
   * @return {ChargeElementGroup}
   */
  createForReturn (ret) {
    validators.assertIsInstanceOf(ret, Return);

    // Get only elements with purpose uses matching the return purpose
    const elements = this._chargeElementContainers
      .filter(chargeElementContainer => isReturnPurposeUseMatch(ret, chargeElementContainer));

    return new ChargeElementGroup(elements);
  }

  /**
   * Creates new ChargeElementGroups for each purpose that match the supplied
   * return line based on the charge period and abs period
   * @param {ReturnLine} returnLine
   * @param {DateRange} chargePeriod
   * @return {Array<ChargeElementGroup>}
   */
  createForReturnLine (returnLine, chargePeriod) {
    validators.assertIsInstanceOf(returnLine, ReturnLine);
    validators.assertIsInstanceOf(chargePeriod, DateRange);

    // Only consider elements with abs period / time limits that match return line
    const elements = this._chargeElementContainers.filter(
      chargeElementContainer => chargeElementContainer.isReturnLineMatch(returnLine)
    );

    if (elements.length === 0) {
      throw new ChargeElementMatchingError(`No charge elements to match for return line ${returnLine.id}`);
    }

    // Sort elements
    const sortedElements = sortBy(elements, getElementSortScore);

    // Check return line falls in charge period
    if (isReturnLineStraddlingChargePeriodError(returnLine, chargePeriod)) {
      this.setTwoPartTariffStatus(ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD);
    }

    // Group by purpose use
    const groups = groupBy(sortedElements,
      element => element.chargeElement.purposeUse.id
    );

    // Return as array of element groups
    return Object.values(groups).map(
      chargeElementContainers => new ChargeElementGroup(chargeElementContainers)
    );
  }

  /**
   * Sets the two part tariff error status code
   * @param {Number} twoPartTariffStatus
   */
  setTwoPartTariffStatus (twoPartTariffStatus) {
    this._chargeElementContainers.forEach(chargeElementContainer =>
      chargeElementContainer.setTwoPartTariffStatus(twoPartTariffStatus)
    );
  }

  /**
   * Allocate a billable volume to the group
   * @param {Number}
   */
  allocate (volume) {
    this._chargeElementContainers.reduce((acc, chargeElementContainer, i) => {
      const isLast = i === this._chargeElementContainers.length - 1;
      const qtyToAllocate = Math.min(
        chargeElementContainer.getAvailableVolume(),
        acc
      );
      chargeElementContainer.billingVolume.allocate(isLast ? acc : qtyToAllocate);
    }, volume);
  }

  /**
   * Re-balance quantities from time-limited elements to base
   * elements when they have matching source, season and purpose
   */
  reallocate () {
    const groups = groupBy(this._chargeElementContainers, getReallocationKey);
    Object.values(groups).forEach(reallocateGroup);
  }

  /**
   * Flags over-abstraction in containers
   */
  flagOverAbstraction () {
    this._chargeElementContainers.forEach(
      chargeElementContainer => chargeElementContainer.flagOverAbstraction()
    );
  }

  /**
   * Gets an array of billing volumes
   * @return {Array<BillingVolume>}
   */
  toBillingVolumes () {
    return this._chargeElementContainers.map(
      chargeElementContainer => chargeElementContainer.billingVolume.toFixed()
    );
  }
};

module.exports = ChargeElementGroup;
