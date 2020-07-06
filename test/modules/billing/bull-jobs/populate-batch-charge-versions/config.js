'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const { logger } = require('../../../../../src/logger');
const jobConfig = require('../../../../../src/modules/billing/bull-jobs/populate-batch-charge-versions/config');
const processChargeVersionYearJob = require('../../../../../src/modules/billing/bull-jobs/process-charge-version-year');
const batchService = require('../../../../../src/modules/billing/services/batch-service');

const sandbox = require('sinon').createSandbox();

experiment('modules/billing/bull-jobs/populate-batch-charge-versions/config.js', () => {
  let result, job;

  beforeEach(async () => {
    job = {
      data: {
        batch: {
          id: 'test-batch-id'
        }
      }
    };

    sandbox.stub(logger, 'info');
    sandbox.stub(processChargeVersionYearJob, 'publish');

    sandbox.stub(batchService, 'setStatusToEmptyWhenNoTransactions');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  test('has the correct queue name', () => {
    expect(jobConfig.jobName).to.equal('billing.populate-batch-charge-versions.*');
  });

  experiment('.createMessage', () => {
    beforeEach(async () => {
      result = jobConfig.createMessage(job.data);
    });

    test('formats the message', async () => {
      expect(result.data).to.equal(job.data);
      expect(result.options.jobId).to.equal('billing.populate-batch-charge-versions.test-batch-id');
    });
  });

  experiment('.onComplete', () => {
    experiment('when there are no charge version years to process', () => {
      beforeEach(async () => {
        const jobResult = {
          chargeVersionYears: [],
          batch: job.data.batch
        };
        await jobConfig.onComplete(job, jobResult);
      });

      test('the batch is set to empty status', async () => {
        expect(batchService.setStatusToEmptyWhenNoTransactions.calledWith(
          job.data.batch
        )).to.be.true();
      });

      test('no other jobs are published', async () => {
        expect(processChargeVersionYearJob.publish.called).to.be.false();
      });
    });

    experiment('when there are charge version years to process', () => {
      beforeEach(async () => {
        const jobResult = {
          chargeVersionYears: [{
            billingbatchChargeVersionYearId: 'test-cv-year-id-1'
          }, {
            billingbatchChargeVersionYearId: 'test-cv-year-id-2'
          }],
          batch: job.data.batch
        };
        await jobConfig.onComplete(job, jobResult);
      });

      test('the batch is not set to empty status', async () => {
        expect(batchService.setStatusToEmptyWhenNoTransactions.called).to.be.false();
      });

      test('a job is published for each charge version year', async () => {
        expect(processChargeVersionYearJob.publish.callCount).to.equal(2);
        const [firstCallData] = processChargeVersionYearJob.publish.firstCall.args;
        expect(firstCallData.chargeVersionYear.billingbatchChargeVersionYearId).to.equal('test-cv-year-id-1');
        const [secondCallData] = processChargeVersionYearJob.publish.secondCall.args;
        expect(secondCallData.chargeVersionYear.billingbatchChargeVersionYearId).to.equal('test-cv-year-id-2');
      });
    });
  });
});
