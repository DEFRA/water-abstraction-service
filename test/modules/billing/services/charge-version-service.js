'use strict';

const {
  experiment,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const repos = require('../../../../src/lib/connectors/repos');

experiment('modules/billing/services/charge-version-service', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingBatchChargeVersions, 'createAnnual');
    sandbox.stub(repos.billingBatchChargeVersions, 'createSupplementary');
    sandbox.stub(repos.billingBatchChargeVersions, 'createTwoPartTariff');
  });

  afterEach(async () => {
    sandbox.restore();
  });
});
