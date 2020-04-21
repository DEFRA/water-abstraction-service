const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { logger } = require('../../../../src/logger');
const importLog = require('../../../../src/modules/import/lib/import-log.js');
const s3DownloadComplete = require('../../../../src/modules/import/jobs/s3-download-complete');

const createJob = failed => ({
  failed,
  data: {
    request: {
      name: 'import.s3-download'
    }
  }
});

experiment('modules/import/jobs/s3-download-import-complete', () => {
  let messageQueue;

  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');

    sandbox.stub(importLog, 'setImportStatus');
    messageQueue = {
      publish: sandbox.stub(),
      deleteQueue: sandbox.stub()
    };
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.handler', () => {
    experiment('when the job succeeds', () => {
      const job = createJob(false);

      beforeEach(async () => {
        await s3DownloadComplete(job, messageQueue);
      });

      test('a message is logged', async () => {
        const [message] = logger.info.lastCall.args;
        expect(message).to.equal('Handling onComplete job: import.s3-download');
      });

      test('existing import.licence job queue is deleted', async () => {
        expect(messageQueue.deleteQueue.calledWith('import.licence')).to.be.true();
      });

      test('existing import.populate-pending-import job queue is deleted', async () => {
        expect(messageQueue.deleteQueue.calledWith('import.populate-pending-import')).to.be.true();
      });

      test('a new job is published to populate the pending import table', async () => {
        const [job] = messageQueue.publish.lastCall.args;
        expect(job.name).to.equal('import.populate-pending-import');
      });
    });

    experiment('when the job fails', () => {
      const job = createJob(true);

      beforeEach(async () => {
        await s3DownloadComplete(job, messageQueue);
      });

      test('a message is logged', async () => {
        const [message] = logger.error.lastCall.args;
        expect(message).to.equal('Job: import.s3-download failed, aborting');
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
        const func = () => s3DownloadComplete(job, messageQueue);
        await expect(func()).to.reject();

        const [message, error] = logger.error.lastCall.args;
        expect(message).to.equal('Error handling onComplete job: import.s3-download');
        expect(error).to.equal(err);
      });
    });
  });
});
