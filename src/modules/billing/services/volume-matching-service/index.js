'use strict';

require('../../../../lib/connectors/db');

// const returnGroupService = require('./return-group-service');
// const chargeVersionService = require('./data-service');
const dataService = require('./data-service');
const matchingService = require('./matching-service');

const validators = require('../../../../lib/models/validators');
const FinancialYear = require('../../../../lib/models/financial-year');

/**
 * Returns matching to water.billing_volumes
 * @param {String} chargeVersionId
 * @param {FinancialYear} financialYear
 * @param {Boolean} matchSummer
 * @param {Boolean} matchWinter
 */
const matchVolumes = async (chargeVersionId, financialYear, matchSummer, matchWinter) => {
  validators.assertId(chargeVersionId);
  validators.assertIsInstanceOf(financialYear, FinancialYear);
  validators.assertIsBoolean(matchSummer);
  validators.assertIsBoolean(matchWinter);

  const data = await dataService.getData(chargeVersionId, financialYear);

  console.log(JSON.stringify(data, null, 2));
  /*
  const context = await chargeVersionService.getChargeVersion(chargeVersionId, financialYear);

  const { chargeVersion, chargeElementGroups } = context;

  const returnGroups = await returnGroupService.getReturnGroups(chargeVersion.licence.licenceNumber, financialYear, chargeElementGroups);

  console.log(context);
  console.log(returnGroups);

  matchingService.match(context, returnGroups, true);
  */
};

const func = async () => {
  try {
    await matchVolumes('02940bef-d098-4439-971c-2f61813f48a1', new FinancialYear(2020), true, true);
  } catch (err) {
    console.error(err);
  }
};

func();

exports.matchVolumes = matchVolumes;
