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

const deleteErroredBatchJob = require('../../../../src/modules/billing/jobs/delete-errored-batch');

// Connectors
const chargeModuleBillRunConnector = require('../../../../src/lib/connectors/charge-module/bill-runs');
const { logger } = require('../../../../src/logger');

// Services
const batchService = require('../../../../src/modules/billing/services/batch-service');
const batchJob = require('../../../../src/modules/billing/jobs/lib/batch-job');

// Models
const Batch = require('../../../../src/lib/models/batch');

experiment('modules/billing/jobs/create-charge', () => {
  const batchId = uuid();
  const externalId = uuid();
  const batch = new Batch(batchId).fromHash({
    externalId
  });

  beforeEach(async () => {
    sandbox.stub(batchJob, 'logHandling');

    sandbox.stub(batchService, 'getBatchById').resolves(batch);

    sandbox.stub(chargeModuleBillRunConnector, 'delete');

    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('exports the expected job name', async () => {
    expect(deleteErroredBatchJob.jobName).to.equal('billing.delete-errored-batch');
  });

  experiment('.createMessage', () => {
    test('creates the expected message array', async () => {
      const message = deleteErroredBatchJob.createMessage(
        batchId
      );

      expect(message).to.equal([
        'billing.delete-errored-batch',
        {
          batchId
        },
        {
          attempts: 6,
          backoff: {
            type: 'exponential',
            delay: 5000
          },
          jobId: `billing.delete-errored-batch.${batchId}`
        }
      ]);
    });
  });

  experiment('.handler', () => {
    let job;

    beforeEach(async () => {
      job = {
        data: {
          batchId
        }
      };

      await deleteErroredBatchJob.handler(job);
    });

    test('the batch is loaded by id', () => {
      expect(batchService.getBatchById.calledWith(
        batchId
      )).to.be.true();
    });

    test('the CM batch is deleted by externalId', () => {
      expect(chargeModuleBillRunConnector.delete.calledWith(
        externalId
      )).to.be.true();
    });
  });

  experiment('.onFailedHandler', () => {
    let job;
    const err = new Error('oops');

    experiment('when deleting the charge module bill run failed and is not the final attempt', () => {
      beforeEach(async () => {
        job = {
          name: deleteErroredBatchJob.jobName,
          id: 'test-id',
          data: {
            batchId
          },
          attemptsMade: 5,
          opts: {
            attempts: 10
          }
        };
        await deleteErroredBatchJob.onFailed(job, err);
      });

      test('the job failure error is logged', async () => {
        expect(logger.error.calledWith(
          'Job billing.delete-errored-batch test-id failed'
        )).to.be.true();
      });
    });

    experiment('when deleting the charge module bill run failed and is not the final attempt', () => {
      beforeEach(async () => {
        job = {
          data: {
            batchId
          },
          attemptsMade: 10,
          opts: {
            attempts: 10
          }
        };
        await deleteErroredBatchJob.onFailed(job, err);
      });

      test('the final error is logged', async () => {
        expect(logger.error.calledWith(
          `Failed to delete charge module bill run for errored batch ${batchId} after ${job.attemptsMade} attempts`
        )).to.be.true();
      });
    });
  });
});
