'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const supplementaryBillingService = require('../../../../src/modules/billing/services/supplementary-billing-service');
const billingTransactionsRepo = require('../../../../src/lib/connectors/repos/billing-transactions');

const batchId = uuid();

experiment('modules/billing/services/supplementary-billing-service', () => {
  beforeEach(async () => {
    sandbox.stub(billingTransactionsRepo, 'findByBatchId');
    sandbox.stub(billingTransactionsRepo, 'findHistoryByBatchId');
    sandbox.stub(billingTransactionsRepo, 'delete');
    sandbox.stub(billingTransactionsRepo, 'create');
  });

  afterEach(async () => {
    sandbox.restore();
  });
});
