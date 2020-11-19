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
const { logger } = require('../../../../src/logger');
const { BATCH_ERROR_CODE } = require('../../../../src/lib/models/batch');

const BATCH_ID = uuid();

experiment('modules/billing/jobs/refresh-totals', () => {
  beforeEach(async () => {
    sandbox.stub(batchService, 'getBatchById');
    sandbox.stub(batchJob, 'logHandling');
    sandbox.stub(batchJob, 'logHandlingError');
    sandbox.stub(batchJob, 'logOnCompleteError');

    sandbox.stub(batchService, 'refreshTotals');
    sandbox.stub(batchService, 'setErrorStatus');

    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.jobName', () => {
    test('is set to the expected value', async () => {
      expect(refreshTotals.jobName).to.equal('billing.refresh-totals');
    });
  });

  experiment('.createMessage', () => {
    let message;

    beforeEach(async () => {
      message = refreshTotals.createMessage(BATCH_ID);
    });

    test('creates the expected message array', async () => {
      const [name, data, options] = message;
      expect(name).to.equal('billing.refresh-totals');
      expect(data).to.equal({ batchId: BATCH_ID });

      expect(options.jobId).to.startWith(`billing.refresh-totals.${BATCH_ID}.`);
      expect(options.attempts).to.equal(10);
      expect(options.backoff).to.equal({
        type: 'exponential',
        delay: 5000
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
        batchService.refreshTotals.resolves(true);
        result = await refreshTotals.handler(job);
      });

      test('logs an info message', async () => {
        expect(batchJob.logHandling.calledWith(job)).to.be.true();
      });

      test('refreshes the totals from the charge module using the batch ID', async () => {
        expect(batchService.refreshTotals.calledWith(BATCH_ID));
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
        batchService.refreshTotals.rejects(error);
        await expect(refreshTotals.handler(job)).to.reject();
      });

      test('a message is logged', async () => {
        const errorArgs = batchJob.logHandlingError.lastCall.args;
        expect(errorArgs[0]).to.equal(job);
        expect(errorArgs[1]).to.equal(error);
      });
    });
  });

  experiment('.onFailedHandler', () => {
    let job;
    const err = new Error('oops');

    experiment('when the attempt to get the bill run summary from CM is not the final one', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId: BATCH_ID
          },
          attemptsMade: 5,
          opts: {
            attempts: 10
          }
        };
        await refreshTotals.onFailed(job, err);
      });

      test('the batch is not updated', async () => {
        expect(batchService.setErrorStatus.called).to.be.false();
      });
    });

    experiment('on the final attempt to get the bill run summary from CM', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId: BATCH_ID
          },
          attemptsMade: 10,
          opts: {
            attempts: 10
          }
        };
        await refreshTotals.onFailed(job, err);
      });

      test('the batch is not updated', async () => {
        expect(batchService.setErrorStatus.calledWith(
          BATCH_ID, BATCH_ERROR_CODE.failedToGetChargeModuleBillRunSummary
        )).to.be.true();
      });
    });
  });
});
