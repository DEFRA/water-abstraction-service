'use-strict';
const chargeTestDataSetUp = require('../../../../../integration-tests/billing/services/scenarios');
const chargeVersions = require('../../../../../integration-tests/billing/services/charge-versions.js');
const billRun = require('./bill-run');
const data = require('./data');

const annualBillRun = async () => {
  const regionId = await chargeTestDataSetUp.createScenario(data.scenarios.AB1);
  return { regionId };
};

/**
 * Creates an annual bill run,
 * Updates the charge version status to superseded and
 * Create a new charge version with increased billable quantity
 * @param {*} request hapi request
 * @param {*} h request header
 */

const supplementaryBillRun = async (request) => {
  const regionId = await chargeTestDataSetUp.createScenario(data.scenarios.SB1.annual);

  // Set up and create an annual bill run to create the data for a supplementary bill run.
  await billRun.createBatchAndExecuteBillRun(request, regionId, 'annual', 2020, false);

  // mark the existing charge version as superseded so the new
  // charge version is the current one.
  await chargeVersions.update({ status: 'superseded' });

  await chargeTestDataSetUp.createScenario(data.scenarios.SB1.supplementary);

  return { regionId };
};

exports.annualBillRun = annualBillRun;
exports.supplementaryBillRun = supplementaryBillRun;
