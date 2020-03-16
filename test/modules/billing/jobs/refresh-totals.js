'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sandbox = require('sinon').createSandbox();

const refreshTotals = require('../../../../src/modules/billing/jobs/refresh-totals');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');
const Batch = require('../../../../src/lib/models/batch');

const BATCH_ID = uuid();

experiment('modules/billing/jobs/refresh-totals', () => {
  let batch;

  beforeEach(async () => {
    batch = new Batch();
    sandbox.stub(batchService, 'getBatchById');
    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logHandlingError');
    sandbox.stub(batchService, 'refreshTotals');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.jobName', () => {
    test('is set to the expected value', async () => {
      expect(refreshTotals.jobName).to.equal('billing.refreshTotals.*');
    });
  });

  experiment('.createMessage', () => {
    let message;
    beforeEach(async () => {
      message = refreshTotals.createMessage(BATCH_ID);
    });

    test('message has the expected name', async () => {
      expect(message.name).to.equal(`billing.refreshTotals.${BATCH_ID}`);
    });

    test('message has the expected data', async () => {
      expect(message.data).to.equal({ batchId: BATCH_ID });
    });

    test('message has the expected options', async () => {
      expect(message.options).to.equal({
        singletonKey: BATCH_ID,
        retryLimit: 5,
        retryDelay: 120,
        retryBackoff: true
      });
    });
  });

  experiment('.handler', () => {
    let job;
    beforeEach(async () => {
      job = {
        data: {
          batchId: BATCH_ID
        }
      };
    });

    experiment('when there are no errors', () => {
      let result;

      beforeEach(async () => {
        result = await refreshTotals.handler(job);
      });

      test('logs an info message', async () => {
        expect(batchJob.logHandling.calledWith(job)).to.be.true();
      });

      test('gets the batch by ID', async () => {
        expect(batchService.getBatchById.calledWith(BATCH_ID)).to.be.true();
      });

      test('passes the returned batch to the .refreshTotals() method', async () => {
        expect(batchService.refreshTotals.calledWith(batch));
      });

      test('no error is logged', async () => {
        expect(batchJob.logHandlingError.called).to.be.false();
      });

      test('the batch is returned', async () => {
        expect(result).to.equal({ batch: job.data.batch });
      });
    });

    experiment('when there are errors', () => {
      let error;

      beforeEach(async () => {
        error = new Error('refresh error');
        batchService.getBatchById.rejects(error);
        await expect(refreshTotals.handler(job)).to.reject();
      });

      test('a message is logged', async () => {
        const errorArgs = batchJob.logHandlingError.lastCall.args;
        expect(errorArgs[0]).to.equal(job);
        expect(errorArgs[1]).to.equal(error);
      });
    });
  });
});
