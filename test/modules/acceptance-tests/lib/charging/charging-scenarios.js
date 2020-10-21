'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const chargeScenarios = require('../../../../../src/modules/acceptance-tests/lib/charging/charging-scenarios');
const testData = require('../../../../../src/modules/acceptance-tests/lib/charging/data');
const billRun = require('../../../../../src/modules/acceptance-tests/lib/charging/bill-run');
const chargeVersions = require('../../../../../integration-tests/billing/services/charge-versions.js');
const chargeTestDataSetUp = require('../../../../../integration-tests/billing/services/scenarios');

experiment('modules/acceptance-tests/lib/charging/scenarios', () => {
  experiment('.annualBillRun', async () => {
    let response;
    beforeEach(async () => {
      sandbox.stub(chargeTestDataSetUp, 'createScenario').resolves('test-region-id');
      response = await chargeScenarios.annualBillRun();
    });

    afterEach(async () => {
      sandbox.restore();
    });
    test('data for annual bill run is created', async () => {
      expect(response).to.equal({ regionId: 'test-region-id' });
    });
    test('calls batchService.create with the correct params', async () => {
      const args = chargeTestDataSetUp.createScenario.lastCall.args[0];
      expect(args).to.equal(testData.scenarios.AB1);
    });
  });
  experiment('.supplementaryBillRun', async () => {
    let response;
    const request = { test: 'test-request' };
    beforeEach(async () => {
      sandbox.stub(chargeTestDataSetUp, 'createScenario').resolves('test-region-id');
      sandbox.stub(billRun, 'createBatchAndExecuteBillRun').resolves();
      sandbox.stub(chargeVersions, 'update').resolves();
      response = await chargeScenarios.supplementaryBillRun(request);
    });

    afterEach(async () => {
      sandbox.restore();
    });
    test('sets up the annual bill run data that precedes the supplementary bill run', async () => {
      const args = chargeTestDataSetUp.createScenario.firstCall.args[0];
      expect(args).to.equal(testData.scenarios.SB1.annual);
    });
    test('calls batchService.create with the correct params', async () => {
      const args = billRun.createBatchAndExecuteBillRun.lastCall.args;
      expect(args).to.equal([request, 'test-region-id', 'annual', 2020, false]);
    });
    test('calls charge version service to update the charge version status', async () => {
      const args = chargeVersions.update.lastCall.args;
      expect(args[0]).to.equal({ status: 'superseded' });
    });
    test('calls batchService.create with the correct params', async () => {
      const args = chargeTestDataSetUp.createScenario.lastCall.args[0];
      expect(args).to.equal(testData.scenarios.SB1.supplementary);
    });
    test('returns the region id', async () => {
      expect(response).to.equal({ regionId: 'test-region-id' });
    });
  });
});
