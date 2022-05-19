'use strict'

const validators = require('../../../../lib/models/validators')
const { logger } = require('../../../../logger')
const Decimal = require('decimal.js-light')

// Models
const DateRange = require('../../../../lib/models/date-range')
const ChargeElementGroup = require('./models/charge-element-group')
const ReturnGroup = require('./models/return-group')
const { RETURN_SEASONS } = require('../../../../lib/models/constants')

// Errors
const { ChargeElementMatchingError } = require('./errors')
const { ERROR_NO_MATCHING_CHARGE_ELEMENT, ERROR_LATE_RETURNS } = require('../../../../lib/models/billing-volume').twoPartTariffStatuses

/**
 * Allocates the return line volume
 * - If there are several groups of matching charge elements
 *   with a single purpose use, then the return line volume
 *   is pro-rated according to the billable ratio of the purposes
 * @param {Array<ChargeElementGroup>} lineChargeElementGroups
 * @param {ReturnLine} returnLine
 */
const allocateReturnLine = (lineChargeElementGroups, returnLine) => {
  const totalVolume = lineChargeElementGroups.reduce((acc, chargeElementGroup) =>
    acc.plus(chargeElementGroup.volume)
  , new Decimal(0))
  // Allocate volumes
  lineChargeElementGroups.forEach(chargeElementGroup => {
    // Get ratio of purposes for allocation
    // This ensures where a return has multiple purposes, the volume is allocated
    // according to the ratio of billable volumes in matching elements
    const purposeRatio = chargeElementGroup.volume.dividedBy(totalVolume)
    // Convert to ML
    const returnLineVolumeInML = new Decimal(returnLine.volume).dividedBy(1000)
    const qty = purposeRatio.times(returnLineVolumeInML)
    return chargeElementGroup.allocate(qty)
  })
}

/**
 * Matches a group of returns against a group of charge elements
 * @param {DateRange} chargePeriod
 * @param {ChargeElementGroup} chargeElementGroup
 * @param {ReturnGroup} returnGroup
 */
const matchReturnGroup = (chargePeriod, chargeElementGroup, returnGroup) => {
  returnGroup.getReturnsWithCurrentVersion().forEach(ret => {
    logger.info(`Matching return ${ret.id}`)

    // Create list of charge elements for return
    const returnChargeElementGroup = chargeElementGroup.createForReturn(ret)

    // Get list of return lines
    const returnLines = ret.currentReturnVersion.getReturnLinesForBilling(chargePeriod, ret.abstractionPeriod)

    returnLines.forEach(returnLine => {
      // Create matching groups array (1 array element per purpose)
      const lineChargeElementGroups = returnChargeElementGroup.createForReturnLine(returnLine, chargePeriod)

      // Allocate return line volume to matching elements
      allocateReturnLine(lineChargeElementGroups, returnLine)
    })
  })
}

/**
 * Performs TPT matching process, returning an array of BillingVolume instances
 * ready for persisting to water.billing_volumes table
 * @param {DateRange} chargePeriod
 * @param {ChargeElementGroup} chargeElementGroup
 * @param {ReturnGroup} returnGroup
 * @return {Array<BillingVolume>}
 */
const match = (chargePeriod, chargeElementGroup, returnGroup, isSummer) => {
  validators.assertIsInstanceOf(chargePeriod, DateRange)
  validators.assertIsInstanceOf(chargeElementGroup, ChargeElementGroup)
  validators.assertIsInstanceOf(returnGroup, ReturnGroup)
  validators.assertIsBoolean(isSummer)

  // Set charge element group return season
  chargeElementGroup.returnSeason = isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear

  // Returns have errors - assign error and full billable/null to billing volumes
  if (returnGroup.errorCode && returnGroup.errorCode !== ERROR_LATE_RETURNS) {
    return chargeElementGroup
      .setTwoPartTariffStatus(returnGroup.errorCode)
      .toBillingVolumes()
  } else if (returnGroup.errorCode === ERROR_LATE_RETURNS) {
    chargeElementGroup.setTwoPartTariffStatus(returnGroup.errorCode)
  }

  try {
    matchReturnGroup(chargePeriod, chargeElementGroup, returnGroup)

    // Perform final steps
    return chargeElementGroup
      .reallocate()
      .flagOverAbstraction()
      .toBillingVolumes()
  } catch (err) {
    if (err instanceof ChargeElementMatchingError) {
      return chargeElementGroup
        .setTwoPartTariffStatus(ERROR_NO_MATCHING_CHARGE_ELEMENT)
        .toBillingVolumes()
    }
    throw err
  }
}

exports.match = match
