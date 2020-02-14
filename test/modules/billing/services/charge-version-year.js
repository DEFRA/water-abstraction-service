'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const repos = require('../../../../src/lib/connectors/repos');
const chargeVersionYearService = require('../../../../src/modules/billing/services/charge-version-year');

const TEST_ID = uuid();

experiment('modules/billing/services/charge-version-year', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingBatchChargeVersionYears, 'update').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.setReadyStatus', () => {
    beforeEach(async () => {
      await chargeVersionYearService.setReadyStatus(TEST_ID);
    });

    test('calls repo update() method with correct arguments', async () => {
      const [id, data] = repos.billingBatchChargeVersionYears.update.lastCall.args;
      expect(id).to.equal(TEST_ID);
      expect(data).to.equal({
        status: 'ready'
      });
    });
  });

  experiment('.setErrorStatus', () => {
    beforeEach(async () => {
      await chargeVersionYearService.setErrorStatus(TEST_ID);
    });

    test('calls repo update() method with correct arguments', async () => {
      const [id, data] = repos.billingBatchChargeVersionYears.update.lastCall.args;
      expect(id).to.equal(TEST_ID);
      expect(data).to.equal({
        status: 'error'
      });
    });
  });
});
