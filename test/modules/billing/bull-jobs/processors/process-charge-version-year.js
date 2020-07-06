'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const { logger } = require('../../../../../src/logger');
const Batch = require('../../../../../src/lib/models/batch');
const batchService = require('../../../../../src/modules/billing/services/batch-service');
const chargeVersionYearService = require('../../../../../src/modules/billing/services/charge-version-year');

const processChargeVersionYearProcessor = require('../../../../../src/modules/billing/bull-jobs/processors/process-charge-version-year');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

experiment('modules/billing/bull-jobs/processors/process-charge-version-year', () => {
  let batch, job, batchId, result;

  beforeEach(async () => {
    batchId = uuid();
    batch = new Batch(batchId);

    job = {
      id: 'test-job-id',
      data: {
        batch: {
          id: batchId
        },
        chargeVersionYear: {
          billingBatchChargeVersionYearId: 'test-charge-version-year-id'
        }
      }
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(batchService, 'getBatchById').resolves(batch);
    sandbox.stub(batchService, 'saveInvoicesToDB').resolves(batch);

    sandbox.stub(chargeVersionYearService, 'processChargeVersionYear').resolves(batch);
    sandbox.stub(chargeVersionYearService, 'setReadyStatus').resolves();

    await processChargeVersionYearProcessor(job);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('the charge version year is processed', async () => {
    expect(chargeVersionYearService.processChargeVersionYear.calledWith(
      job.data.chargeVersionYear
    )).to.be.true();
  });

  test('the result of the charge version year processing is persisted', async () => {
    expect(batchService.saveInvoicesToDB.calledWith(
      batch
    )).to.be.true();
  });

  test('the charge version year is set to "ready" status', async () => {
    expect(chargeVersionYearService.setReadyStatus.calledWith(
      job.data.chargeVersionYear.billingBatchChargeVersionYearId
    )).to.be.true();
  });
});
