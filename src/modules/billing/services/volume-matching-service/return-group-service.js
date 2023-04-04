'use strict'

const validators = require('../../../../lib/models/validators')

// Services
const returnsService = require('../../../../lib/services/returns')
const { groupBy } = require('../../../../lib/object-helpers')

// Models
const FinancialYear = require('../../../../lib/models/financial-year')
const ReturnGroup = require('./models/return-group')
const { RETURN_SEASONS } = require('../../../../lib/models/constants')

const getReturnGroupKey = ret => ret.isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear

/**
 * Places returns into groups for summer and winter/all-year
 * @param {Array<Return>} returns
 * @param {Object} chargeElementGroups
 */
const createReturnGroups = (returns) => {
  // Group by season
  const returnGroups = groupBy(returns, getReturnGroupKey)
  return {
    [RETURN_SEASONS.summer]: new ReturnGroup(returnGroups[RETURN_SEASONS.summer]).createForTwoPartTariff(),
    [RETURN_SEASONS.winterAllYear]: new ReturnGroup(returnGroups[RETURN_SEASONS.winterAllYear]).createForTwoPartTariff()
  }
}

/**
 * Get return in seasonal groups for specified licence in given financial year.
 * @param {String} licenceNumber
 * @param {FinancialYear} financialYear
 * @param {ChargeElementGroup} summerChargeElementGroup
 * @return {Promise<Object>} ReturnGroup intances for summer, winterAllYear
 */
const getReturnGroups = async (licenceNumber, financialYear) => {
  validators.assertLicenceNumber(licenceNumber)
  validators.assertIsInstanceOf(financialYear, FinancialYear)

  // Get all returns and group by season
  const returns = await returnsService.getReturnsForLicenceInFinancialYear(licenceNumber, financialYear)
  return createReturnGroups(returns)
}

exports.getReturnGroups = getReturnGroups
