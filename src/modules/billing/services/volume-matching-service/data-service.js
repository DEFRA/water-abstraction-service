'use strict';

const validators = require('../../../../lib/models/validators');
const errors = require('../../../../lib/errors');

const { getChargePeriod } = require('../../lib/charge-period');

// Services
const chargeVersionService = require('../charge-version-service');
const returnGroupService = require('./return-group-service');

// Models
const FinancialYear = require('../../../../lib/models/financial-year');
const ChargeElementContainer = require('./models/charge-element-container');
const ChargeElementGroup = require('./models/charge-element-group');
const { RETURN_SEASONS } = require('../../../../lib/models/constants');

const createChargeElementGroup = (chargeVersion, chargePeriod) => {
  const chargeElementContainers = chargeVersion.chargeElements.map(chargeElement => new ChargeElementContainer(chargeElement, chargePeriod));
  return new ChargeElementGroup(chargeElementContainers);
};

/**
 * Creates a ChargeElementGroup for all the elements that are
 * suitable for two-part tariff billing, then splits them
 * in two groups for summer or winter/all-year
 * @param {ChargeVersion} chargeVersion
 * @param {DateRange0} chargePeriod
 * @return {Object}
 */
const createChargeElementGroups = (chargeVersion, chargePeriod, financialYear) => {
  const tptChargeElementGroup = createChargeElementGroup(chargeVersion, chargePeriod)
    .createForChargePeriod()
    .createForTwoPartTariff()
    .setFinancialYear(financialYear);

  return {
    [RETURN_SEASONS.summer]: tptChargeElementGroup.createForSeason(RETURN_SEASONS.summer),
    [RETURN_SEASONS.winterAllYear]: tptChargeElementGroup.createForSeason(RETURN_SEASONS.winterAllYear)
  };
};

/**
 * Loads the specified charge version and returns as service model.
 * Throws error if not found
 * @param {String} chargeVersionId
 * @return {ChargeVersion}
 */
const getChargeVersion = async chargeVersionId => {
  const chargeVersion = await chargeVersionService.getByChargeVersionId(chargeVersionId);
  if (chargeVersion) {
    return chargeVersion;
  }
  throw new errors.NotFoundError(`Charge version ${chargeVersionId} not found`);
};

/**
 * Collects all the data needed to perform TPT matching for a particular
 * charge version, financial year and season combination
 * @param {String} chargeVersionId
 * @param {FinancialYear} financialYear
 * @return {Promise<Object>}
 */
const getData = async (chargeVersionId, financialYear) => {
  validators.assertId(chargeVersionId);
  validators.assertIsInstanceOf(financialYear, FinancialYear);

  // Get charge version
  const chargeVersion = await getChargeVersion(chargeVersionId);

  // Get charge period
  const chargePeriod = getChargePeriod(financialYear, chargeVersion);

  // Get charge element groups
  const chargeElementGroups = createChargeElementGroups(chargeVersion, chargePeriod, financialYear);

  // Get all returns and group by season
  const returnGroups = await returnGroupService.getReturnGroups(
    chargeVersion.licence.licenceNumber,
    financialYear,
    chargeElementGroups[RETURN_SEASONS.summer]
  );

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
