const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { logger } = require('../../../../src/logger');
const importLog = require('../../../../src/modules/import/lib/import-log.js');
const populatePendingImportComplete = require('../../../../src/modules/import/jobs/populate-pending-import-complete');

const createJob = failed => ({
  failed,
  data: {
    response: {
      licenceNumbers: ['licence-1', 'licence-2']
    },
    request: {
      name: 'import.populate-pending-import'
    }
  }
});

experiment('modules/import/jobs/populate-pending-import-complete', () => {
  let messageQueue;

  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');

    sandbox.stub(importLog, 'setImportStatus');
    messageQueue = {
      publish: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.handler', () => {
    experiment('when the job succeeds', () => {
      const job = createJob(false);

      beforeEach(async () => {
        await populatePendingImportComplete(job, messageQueue);
      });

      test('a message is logged', async () => {
        const [message] = logger.info.lastCall.args;
        expect(message).to.equal('Handling onComplete job: import.populate-pending-import');
      });

      test('a job is published to import the first licence', async () => {
        const [job] = messageQueue.publish.firstCall.args;
        expect(job.data.licenceNumber).to.equal('licence-1');
      });

      test('a job is published to import the second licence', async () => {
        const [job] = messageQueue.publish.lastCall.args;
        expect(job.data.licenceNumber).to.equal('licence-2');
      });
    });

    experiment('when the job fails', () => {
      const job = createJob(true);

      beforeEach(async () => {
        await populatePendingImportComplete(job, messageQueue);
      });

      test('a message is logged', async () => {
        const [message] = logger.info.lastCall.args;
        expect(message).to.equal('Handling onComplete job: import.populate-pending-import');
      });

      test('no further jobs are published', async () => {
        expect(messageQueue.publish.called).to.be.false();
      });
    });

    experiment('when publishing a new job fails', () => {
      const err = new Error('oops');

      const job = createJob(false);

      beforeEach(async () => {
        messageQueue.publish.rejects(err);
      });

      test('an error message is logged and rethrown', async () => {
        const func = () => populatePendingImportComplete(job, messageQueue);
        await expect(func()).to.reject();

        const [message, error] = logger.error.lastCall.args;
        expect(message).to.equal('Handling onComplete job: import.populate-pending-import');
        expect(error).to.equal(err);
      });
    });
  });
});
