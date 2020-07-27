'use strict';

const { groupBy } = require('lodash');

const validators = require('../../../../lib/models/validators');

// Services
const returnsService = require('../../../../lib/services/returns');

// Models
const ChargeElementGroup = require('./models/charge-element-group');
const FinancialYear = require('../../../../lib/models/financial-year');
const ReturnGroup = require('./models/return-group');
const { RETURN_SEASONS } = require('../../../../lib/models/constants');

/**
 * Gets the return season, taking into account the return isSummer flag,
 * and whether there are any summer charge elements with a matching purpose for matching
 * @param {Return} ret
 * @param {ChargeElementGroup} summerChargeElementGroup
 * @return {String} return season
 */
const getReturnSeason = (ret, summerChargeElementGroup) => {
  const isSummerMatch = ret.isSummer && ret.purposeUses.some(purposeUse => {
    return summerChargeElementGroup.isPurposeUseMatch(purposeUse);
  });
  return isSummerMatch ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear;
};

/**
 * Places returns into groups for summer and winter/all-year
 * @param {Array<Return>} returns
 * @param {Object} chargeElementGroups
 */
const createReturnGroups = (returns, summerChargeElementGroup) => {
  // Group by season
  const returnGroups = groupBy(returns, ret => getReturnSeason(ret, summerChargeElementGroup));
  return {
    [RETURN_SEASONS.summer]: new ReturnGroup(returnGroups[RETURN_SEASONS.summer]).createForTwoPartTariff(),
    [RETURN_SEASONS.winterAllYear]: new ReturnGroup(returnGroups[RETURN_SEASONS.winterAllYear]).createForTwoPartTariff()
  };
};

/**
 * Get return in seasonal groups for specified licence in given financial year.
 * @param {String} licenceNumber
 * @param {FinancialYear} financialYear
 * @param {ChargeElementGroup} summerChargeElementGroup
 * @return {Promise<Object>} ReturnGroup intances for summer, winterAllYear
 */
const getReturnGroups = async (licenceNumber, financialYear, summerChargeElementGroup) => {
  validators.assertLicenceNumber(licenceNumber);
  validators.assertIsInstanceOf(financialYear, FinancialYear);
  validators.assertIsInstanceOf(summerChargeElementGroup, ChargeElementGroup);

  // Get all returns and group by season
  const returns = await returnsService.getReturnsForLicenceInFinancialYear(licenceNumber, financialYear);
  return createReturnGroups(returns, summerChargeElementGroup);
};

exports.getReturnGroups = getReturnGroups;
