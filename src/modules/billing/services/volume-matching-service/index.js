'use strict';

require('../../../../lib/connectors/db');

const dataService = require('./data-service');
const matchingService = require('./matching-service');

const validators = require('../../../../lib/models/validators');
const FinancialYear = require('../../../../lib/models/financial-year');
const { RETURN_SEASONS } = require('../../../../lib/models/constants');

/**
 * Returns matching to water.billing_volumes
 * @param {String} chargeVersionId
 * @param {FinancialYear} financialYear
 * @param {Boolean} isSummer - flag to indicate summer or winter/all-year TPT matching
 * @return {Promise<Array>} resolves with an array of BillingVolume instances
 */
const matchVolumes = async (chargeVersionId, financialYear, isSummer, batchId) => {
  validators.assertId(chargeVersionId);
  validators.assertIsInstanceOf(financialYear, FinancialYear);
  validators.assertIsBoolean(isSummer);

  const { chargeElementGroup, returnGroups, chargePeriod } = await dataService.getData(chargeVersionId, financialYear, batchId);

  const seasonKey = isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear;

  return matchingService.match(chargePeriod, chargeElementGroup, returnGroups[seasonKey], isSummer);
};

exports.matchVolumes = matchVolumes;
