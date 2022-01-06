'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const batchJob = require('../../../../../src/modules/billing/jobs/lib/batch-job');
const batchService = require('../../../../../src/modules/billing/services/batch-service');
const { logger } = require('../../../../../src/logger');

experiment('modules/billing/jobs/lib/batch-job', () => {
  beforeEach(async () => {
    sandbox.stub(batchService, 'setErrorStatus').resolves();

    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.logHandling', () => {
    let job;

    beforeEach(async () => {
      job = {
        id: 'test-job-id'
      };
    });

    test('create the expected message', async () => {
      batchJob.logHandling(job);

      const [message] = logger.info.lastCall.args;
      expect(message).to.equal('Handling: test-job-id');
    });
  });

  experiment('.logHandlingError', () => {
    let job;
    let error;

    beforeEach(async () => {
      job = {
        id: 'test-job-id'
      };

      error = new Error('oops');
      batchJob.logHandlingError(job, error);
    });

    test('creates the expected message', async () => {
      const [message] = logger.error.lastCall.args;
      expect(message).to.equal('Error handling: test-job-id');
    });

    test('passes the error', async () => {
      const [, err] = logger.error.lastCall.args;
      expect(err).to.equal(error);
    });

    test('logs the data', async () => {
      const [, , context] = logger.error.lastCall.args;
      expect(context).to.equal(job.data);
    });
  });

  experiment('.logOnComplete', () => {
    let job;

    beforeEach(async () => {
      job = {
        id: 'test-job-id'
      };
    });

    test('create the expected message for a success', async () => {
      batchJob.logOnComplete(job);

      const [message] = logger.info.lastCall.args;
      expect(message).to.equal('onComplete: test-job-id');
    });
  });

  experiment('.logOnCompleteError', () => {
    let job;
    let error;

    beforeEach(async () => {
      job = {
        id: 'test-job-id'
      };

      error = new Error('oops');

      batchJob.logOnCompleteError(job, error);
    });

    test('create the expected message', async () => {
      const [message] = logger.error.lastCall.args;
      expect(message).to.equal('Error handling onComplete: test-job-id');
    });

    test('passes the error', async () => {
      const [, err] = logger.error.lastCall.args;
      expect(err).to.equal(error);
    });

    test('passes the request data', async () => {
      const [, , context] = logger.error.lastCall.args;
      expect(context).to.equal(job.data);
    });
  });

  experiment('logHandlingErrorAndSetBatchStatus', () => {
    let job, error;
    const err = new Error('oops');

    beforeEach(async () => {
      job = {
        id: 'test-job-id',
        data: {
          batchId: 'test-batch-id'
        }
      };
      error = await batchJob.logHandlingErrorAndSetBatchStatus(job, err, 123);
    });

    test('creates the expected message', async () => {
      const [message] = logger.error.lastCall.args;
      expect(message).to.equal('Error handling: test-job-id');
    });

    test('passes the error', async () => {
      const [, err] = logger.error.lastCall.args;
      expect(err).to.equal(error);
    });

    test('logs the data', async () => {
      const [, , context] = logger.error.lastCall.args;
      expect(context).to.equal(job.data);
    });

    test('marks the batch as "error" status', async () => {
      expect(batchService.setErrorStatus.calledWith(
        'test-batch-id', 123
      )).to.be.true();
    });
  });
});
