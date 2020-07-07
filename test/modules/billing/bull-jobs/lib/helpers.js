'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const helpers = require('../../../../../src/modules/billing/bull-jobs/lib/helpers');
const batchService = require('../../../../../src/modules/billing/services/batch-service');
const { logger } = require('../../../../../src/logger');

const sinon = require('sinon');
const sandbox = sinon.createSandbox();

// const jobName = 'test-queue-name';

experiment('modules/billing/bull-jobs/lib/queue-factory', () => {
  // let queueStub, result, job, batch;
  let queueStub;

  beforeEach(async () => {
    queueStub = {
      removeJobs: sandbox.stub()
    };

    sandbox.stub(batchService, 'setErrorStatus');

    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createQueue', () => {
    test('creates a Bull queue', async () => {
      const queue = helpers.createQueue('test-name');
      expect(queue.constructor.name).to.equal('Queue');
      expect(queue.name).to.equal('test-name');
    });
  });

  experiment('.createJobId', () => {
    let batch;

    beforeEach(async () => {
      batch = {
        id: 'test-batch-id'
      };
    });

    test('creates a job ID with no optional ID', async () => {
      const jobId = helpers.createJobId('billing.test-job-name.*', batch);
      expect(jobId).to.equal('billing.test-job-name.test-batch-id');
    });

    test('creates a job ID with an optional ID appended', async () => {
      const jobId = helpers.createJobId('billing.test-job-name.*', batch, 'test-id');
      expect(jobId).to.equal('billing.test-job-name.test-batch-id.test-id');
    });
  });

  experiment('.createFailedHandler', () => {
    let job, error;
    const errorCode = 123;

    beforeEach(async () => {
      job = {
        data: {
          batch: {
            id: 'test-batch-id'
          }
        },
        id: 'test-job-id'
      };
      error = new Error('oh no!');
      const failedHandler = helpers.createFailedHandler('test-job-name.*', errorCode);
      await failedHandler(queueStub, job, error);
    });

    test('an error message is logged', async () => {
      const [message, err, data] = logger.error.firstCall.args;
      expect(message).to.equal('Failed: test-job-id');
      expect(err).to.equal(error);
      expect(data).to.equal(job.data);
    });

    test('remaining jobs in queue are deleted', async () => {
      expect(queueStub.removeJobs.calledWith('test-job-name.test-batch-id*')).to.be.true();
    });

    test('the batch is set to error status and error code logged in DB', async () => {
      expect(batchService.setErrorStatus.calledWith(
        'test-batch-id', errorCode
      )).to.be.true();
    });
  });

  experiment('.createMessage', async () => {
    let message;
    beforeEach(async () => {
      message = helpers.createMessage('test-job-name', {
        batch: {
          id: 'test-batch-id'
        }
      });
    });

    test('the message has the correct data', async () => {
      expect(message).to.equal({
        data: { batch: { id: 'test-batch-id' } },
        options: { jobId: 'test-job-name' }
      });
    });
  });
});
