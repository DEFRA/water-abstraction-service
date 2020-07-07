'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { logger } = require('../../../../../src/logger');
const jobConfig = require('../../../../../src/modules/billing/bull-jobs/process-charge-version-year/config');
const prepareTransactionsJob = require('../../../../../src/modules/billing/bull-jobs/prepare-transactions');
const batchService = require('../../../../../src/modules/billing/services/batch-service');
const chargeVersionYearService = require('../../../../../src/modules/billing/services/charge-version-year');
const billingVolumesService = require('../../../../../src/modules/billing/services/billing-volumes-service');

const sandbox = require('sinon').createSandbox();

experiment('modules/billing/bull-jobs/process-charge-version-year/config.js', () => {
  let result, job;

  beforeEach(async () => {
    job = {
      data: {
        batch: {
          id: 'test-batch-id'
        },
        chargeVersionYear: {
          billingBatchChargeVersionYearId: 'test-cv-year-id'
        }
      }
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(prepareTransactionsJob, 'publish');

    sandbox.stub(batchService, 'setStatusToEmptyWhenNoTransactions');
    sandbox.stub(batchService, 'setStatus');
    sandbox.stub(chargeVersionYearService, 'getStatusCounts');
    sandbox.stub(billingVolumesService, 'getUnapprovedVolumesForBatchCount');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('has the correct queue name', () => {
    expect(jobConfig.jobName).to.equal('billing.process-charge-version-year.*');
  });

  experiment('.createMessage', () => {
    beforeEach(async () => {
      result = jobConfig.createMessage(job.data);
    });

    test('formats the message', async () => {
      expect(result.data).to.equal(job.data);
      expect(result.options.jobId).to.equal('billing.process-charge-version-year.test-batch-id.test-cv-year-id');
    });
  });

  experiment('.onComplete', () => {
    experiment('when there are still transactions remaining to process', () => {
      beforeEach(async () => {
        chargeVersionYearService.getStatusCounts.resolves({
          processing: 3,
          ready: 2
        });
        await jobConfig.onComplete(job);
      });

      test('gets charge version year status counts for the batch', async () => {
        expect(
          chargeVersionYearService.getStatusCounts.calledWith('test-batch-id')
        ).to.be.true();
      });

      test('does not set the batch status', async () => {
        expect(
          batchService.setStatus.called
        ).to.be.false();
      });

      test('does not publish the next job', async () => {
        expect(
          prepareTransactionsJob.publish.called
        ).to.be.false();
      });
    });

    experiment('when all transactions are processed', () => {
      beforeEach(async () => {
        chargeVersionYearService.getStatusCounts.resolves({
          processing: 0,
          ready: 5
        });
      });

      experiment('when there are unapproved billing volumes', () => {
        beforeEach(async () => {
          billingVolumesService.getUnapprovedVolumesForBatchCount.resolves(5);
          await jobConfig.onComplete(job);
        });

        test('sets batch status to "review"', async () => {
          expect(batchService.setStatus.calledWith(job.data.batch.id, 'review'));
        });

        test('does not call the next job', async () => {
          expect(prepareTransactionsJob.publish.called).to.be.false();
        });
      });

      experiment('when there are no unapproved billing volumes', () => {
        beforeEach(async () => {
          billingVolumesService.getUnapprovedVolumesForBatchCount.resolves(0);
          await jobConfig.onComplete(job);
        });

        test('the batch status is not updated', async () => {
          expect(batchService.setStatus.called).to.be.false();
        });

        test('publishes the next job', async () => {
          expect(prepareTransactionsJob.publish.calledWith({
            batch: job.data.batch
          })).to.be.true();
        });
      });
    });
  });
});
