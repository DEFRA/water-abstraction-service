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
const licenceService = require('../../../../../src/lib/services/licences');
const { logger } = require('../../../../../src/logger');

experiment('modules/billing/jobs/lib/batch-job', () => {
  let messageQueue;

  beforeEach(async () => {
    sandbox.stub(batchService, 'setErrorStatus').resolves();

    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');

    sandbox.stub(
      licenceService,
      'updateIncludeInSupplementaryBillingStatusForUnsentBatch'
    ).resolves();

    messageQueue = {
      deleteQueue: sandbox.spy()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.failBatch', () => {
    let job;
    let batchId;
    let eventId;

    beforeEach(async () => {
      batchId = '00000000-0000-0000-0000-000000000000';
      eventId = '11111111-1111-1111-1111-111111111111';
      job = {
        data: {
          request: {
            name: `failed-job.${batchId}`,
            data: {
              eventId,
              batch: {
                id: batchId
              }
            }
          }
        }
      };
      await batchJob.failBatch(job, messageQueue, 10);
    });

    test('sets the batch to error', async () => {
      const [id, code] = batchService.setErrorStatus.lastCall.args;
      expect(id).to.equal(batchId);
      expect(code).to.equal(10);
    });

    test('updates the supplementary billing status of any licences', async () => {
      const [id] = licenceService.updateIncludeInSupplementaryBillingStatusForUnsentBatch.lastCall.args;
      expect(id).to.equal(batchId);
    });

    test('deletes the queue', async () => {
      const [name] = messageQueue.deleteQueue.lastCall.args;
      expect(name).to.equal(`failed-job.${batchId}`);
    });
  });

  experiment('.logHandling', () => {
    let job;

    beforeEach(async () => {
      job = {
        name: 'test-name'
      };
    });

    test('create the expected message', async () => {
      batchJob.logHandling(job);

      const [message] = logger.info.lastCall.args;
      expect(message).to.equal('Handling: test-name');
    });
  });

  experiment('.logHandlingError', () => {
    let job;
    let error;

    beforeEach(async () => {
      job = {
        name: 'test-name',
        data: {
          batch: {
            id: 'test-batch-id'
          }
        }
      };

      error = new Error('oops');
      batchJob.logHandlingError(job, error);
    });

    test('creates the expected message', async () => {
      const [message] = logger.error.lastCall.args;
      expect(message).to.equal('Error: test-name');
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
        data: {
          request: {
            name: 'test-name'
          }
        },
        failed: false
      };
    });

    test('create the expected message for a success', async () => {
      batchJob.logOnComplete(job);

      const [message] = logger.info.lastCall.args;
      expect(message).to.equal('onComplete: test-name - Success');
    });

    test('create the expected message for a failure', async () => {
      job.failed = true;
      batchJob.logOnComplete(job);

      const [message] = logger.info.lastCall.args;
      expect(message).to.equal('onComplete: test-name - Error');
    });
  });

  experiment('.logOnCompleteError', () => {
    let job;
    let error;

    beforeEach(async () => {
      job = {
        data: {
          request: {
            name: 'test-name',
            data: {
              batch: {
                id: 'test-batch-id'
              }
            }
          }
        },
        failed: false
      };

      error = new Error('oops');

      batchJob.logOnCompleteError(job, error);
    });

    test('create the expected message', async () => {
      const [message] = logger.error.lastCall.args;
      expect(message).to.equal('Error handling onComplete: test-name');
    });

    test('passes the error', async () => {
      const [, err] = logger.error.lastCall.args;
      expect(err).to.equal(error);
    });

    test('passes the request data', async () => {
      const [, , context] = logger.error.lastCall.args;
      expect(context).to.equal(job.data.request.data);
    });
  });

  experiment('.createMessage', () => {
    let batch;

    beforeEach(async () => {
      batch = {
        id: 'test-batch-id'
      };
    });

    test('creates a basic message', async () => {
      const template = 'hello.*';
      const message = batchJob.createMessage(template, batch);

      expect(message).to.equal({
        name: 'hello.test-batch-id',
        data: {
          batch: {
            id: 'test-batch-id'
          }
        }
      });
    });

    test('can include additional data', async () => {
      const template = 'more-data.*';
      const data = {
        licence: {
          id: 'test-licence-id'
        },
        chargeVersion: {
          id: 'test-charge-version-id'
        }
      };
      const message = batchJob.createMessage(template, batch, data);

      expect(message).to.equal({
        name: 'more-data.test-batch-id',
        data: {
          licence: {
            id: 'test-licence-id'
          },
          chargeVersion: {
            id: 'test-charge-version-id'
          },
          batch: {
            id: 'test-batch-id'
          }
        }
      });
    });

    test('can include additional options', async () => {
      const template = 'with-options.*';
      const data = {
        licence: {
          id: 'test-licence-id'
        }
      };

      const options = {
        singletonKey: 'key'
      };

      const message = batchJob.createMessage(template, batch, data, options);

      expect(message).to.equal({
        name: 'with-options.test-batch-id',
        data: {
          licence: {
            id: 'test-licence-id'
          },
          batch: {
            id: 'test-batch-id'
          }
        },
        options: {
          singletonKey: 'key'
        }
      });
    });
  });

  experiment('.hasJobFailed', () => {
    test('returns true if the job has failed', async () => {
      const job = {
        data: {
          failed: true
        }
      };
      expect(batchJob.hasJobFailed(job)).to.equal(true);
    });

    test('returns true if the job is OK', async () => {
      const job = {
        data: {
          failed: false
        }
      };
      expect(batchJob.hasJobFailed(job)).to.equal(false);
    });
  });

  experiment('.deleteOnCompleteQueue', () => {
    let job;

    beforeEach(async () => {
      job = {
        data: {
          request: {
            name: 'test-name'
          }
        }
      };
      await batchJob.deleteOnCompleteQueue(job, messageQueue);
    });

    test('deletes onComplete queue related to current job', async () => {
      const [name] = messageQueue.deleteQueue.lastCall.args;
      expect(name).to.equal('__state__completed__test-name');
    });
  });
});
