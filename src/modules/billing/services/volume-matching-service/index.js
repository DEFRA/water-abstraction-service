'use strict';

require('../../../../lib/connectors/db');

const validators = require('../../../../lib/models/validators');
const FinancialYear = require('../../../../lib/models/financial-year');

const prepareMatching = require('./prepare-matching');
const prepareReturns = require('./prepare-returns');

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

  const matching = await prepareMatching.getInitialDataStructure(chargeVersionId, financialYear);

  const returns = await prepareReturns.getReturns(matching.licence.licenceNumber, financialYear);

  console.log(JSON.stringify({ matching, returns }, null, 2));
};

const func = async () => {
  await matchVolumes('02940bef-d098-4439-971c-2f61813f48a1', new FinancialYear(2020), true, true);
};

func();

exports.matchVolumes = matchVolumes;
