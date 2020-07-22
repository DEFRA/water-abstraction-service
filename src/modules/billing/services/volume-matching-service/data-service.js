'use strict';

const { groupBy } = require('lodash');

const validators = require('../../../../lib/models/validators');
const errors = require('../../../../lib/errors');

const { getChargePeriod } = require('../../lib/charge-period');

// Services
const returnsService = require('../../../../lib/services/returns');

// Models
const FinancialYear = require('../../../../lib/models/financial-year');
const ChargeElementContainer = require('./models/charge-element-container');
const ChargeElementGroup = require('./models/charge-element-group');
const ReturnGroup = require('./models/return-group');

const chargeVersionService = require('../charge-version-service');
const { RETURN_SEASONS } = require('../../../../lib/models/constants');

const createChargeElementGroup = (chargeVersion, chargePeriod) => {
  const chargeElementContainers = chargeVersion.chargeElements.map(chargeElement => new ChargeElementContainer(chargeElement, chargePeriod));
  return new ChargeElementGroup(chargeElementContainers);
};

const createChargeElementGroups = (chargeVersion, chargePeriod) => {
  const tptChargeElementGroup = createChargeElementGroup(chargeVersion, chargePeriod)
    .createForTwoPartTariff();
  return {
    [RETURN_SEASONS.summer]: tptChargeElementGroup.createForSeason(RETURN_SEASONS.summer),
    [RETURN_SEASONS.winterAllYear]: tptChargeElementGroup.createForSeason(RETURN_SEASONS.winterAllYear)
  };
};

/**
 * Gets the return season, taking into account the return isSummer flag,
 * and whether there are any summer charge elements with a matching purpose
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
const createReturnGroups = (returns, chargeElementGroups) => {
  // Group by season
  const returnGroups = groupBy(returns, ret => getReturnSeason(ret, chargeElementGroups[RETURN_SEASONS.summer]));
  return {
    [RETURN_SEASONS.summer]: new ReturnGroup(returnGroups[RETURN_SEASONS.summer]).createForTwoPartTariff(),
    [RETURN_SEASONS.winterAllYear]: new ReturnGroup(returnGroups[RETURN_SEASONS.winterAllYear]).createForTwoPartTariff()
  };
};

/**
 * Gets all the data needed to perform the matching
 * @param {String} chargeVersionId
 * @param {FinancialYear} financialYear
 */
const getData = async (chargeVersionId, financialYear) => {
  validators.assertId(chargeVersionId);
  validators.assertIsInstanceOf(financialYear, FinancialYear);

  // Get charge version
  const chargeVersion = await chargeVersionService.getByChargeVersionId(chargeVersionId);
  if (!chargeVersion) {
    throw new errors.NotFoundError(`Charge version ${chargeVersionId} not found`);
  }

  // Get charge period
  const chargePeriod = getChargePeriod(financialYear, chargeVersion);

  // Get charge element groups
  const chargeElementGroups = createChargeElementGroups(chargeVersion, chargePeriod);

  // Get all returns and group by season
  const returns = await returnsService.getReturnsForLicenceInFinancialYear(chargeVersion.licence.licenceNumber, financialYear);
  const returnGroups = createReturnGroups(returns, chargeElementGroups);

  return {
    chargeVersion,
    chargePeriod,
    seasons: {
      [RETURN_SEASONS.summer]: {
        chargeElementGroup: chargeElementGroups[RETURN_SEASONS.summer],
        returnGroup: returnGroups[RETURN_SEASONS.summer]
      },
      [RETURN_SEASONS.winterAllYear]: {
        chargeElementGroup: chargeElementGroups[RETURN_SEASONS.winterAllYear],
        returnGroup: returnGroups[RETURN_SEASONS.winterAllYear]
      }
    }
  };
};

exports.getData = getData;
