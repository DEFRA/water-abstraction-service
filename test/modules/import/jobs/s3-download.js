const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { logger } = require('../../../../src/logger');
const extract = require('../../../../src/modules/import/services/extract-service.js');
const s3Download = require('../../../../src/modules/import/jobs/s3-download');

experiment('modules/import/jobs/s3-download', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');

    sandbox.stub(extract, 'downloadAndExtract');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createMessage', () => {
    test('formats a message for PG boss', async () => {
      const job = s3Download.createMessage();
      expect(job).to.equal({
        name: 'import.s3-download',
        options: {
          expireIn: '1 hours',
          singletonKey: 'import.s3-download'
        }
      });
    });
  });

  experiment('.handler', () => {
    experiment('when the job is successful', () => {
      const job = {
        name: 'import.s3-download'
      };

      beforeEach(async () => {
        await s3Download.handler(job);
      });

      test('a message is logged', async () => {
        const [message] = logger.info.lastCall.args;
        expect(message).to.equal('Handling job: import.s3-download');
      });

      test('downloads and extracts from S3 bucket', async () => {
        expect(extract.downloadAndExtract.called).to.be.true();
      });
    });

    experiment('when the job fails', () => {
      const err = new Error('Oops!');

      const job = {
        name: 'import.s3-download'
      };

      beforeEach(async () => {
        extract.downloadAndExtract.throws(err);
      });

      test('logs an error message', async () => {
        const func = () => s3Download.handler(job);
        await expect(func()).to.reject();
        expect(logger.error.calledWith(
          'Error handling job import.s3-download', err
        )).to.be.true();
      });

      test('rethrows the error', async () => {
        const func = () => s3Download.handler(job);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oops!');
      });
    });
  });
});
