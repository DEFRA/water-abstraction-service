const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { logger } = require('../../../../src/logger');
const importLog = require('../../../../src/modules/import/lib/import-log.js');
const importLicence = require('../../../../src/modules/import/jobs/import-licence');
const licenceLoader = require('../../../../src/modules/import/load');
const assertImportTableExists = require('../../../../src/modules/import/lib/assert-import-tables-exist');

experiment('modules/import/jobs/import-licence', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');

    sandbox.stub(importLog, 'setImportStatus');
    sandbox.stub(licenceLoader, 'load');
    sandbox.stub(assertImportTableExists, 'assertImportTableExists');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.options', () => {
    test('has teamSize set to 100', async () => {
      expect(importLicence.options.teamSize).to.equal(100);
    });

    test('has teamConcurrency set to 1', async () => {
      expect(importLicence.options.teamConcurrency).to.equal(1);
    });
  });

  experiment('.createMessage', () => {
    test('formats a message for PG boss', async () => {
      const job = importLicence.createMessage('test-licence-number');
      expect(job).to.equal({
        data: { licenceNumber: 'test-licence-number' },
        name: 'import.licence',
        options: { singletonKey: 'test-licence-number' }
      });
    });
  });

  experiment('.handler', () => {
    experiment('when the licence import was successful', () => {
      const job = {
        name: 'import.licence',
        data: {
          licenceNumber: 'test-licence-number'
        }
      };

      beforeEach(async () => {
        await importLicence.handler(job);
      });

      test('a message is logged', async () => {
        const [message, params] = logger.info.lastCall.args;
        expect(message).to.equal('Handling job: import.licence');
        expect(params).to.equal({
          licenceNumber: 'test-licence-number'
        });
      });

      test('asserts that the import tables exist', async () => {
        expect(assertImportTableExists.assertImportTableExists.called).to.be.true();
      });

      test('loads the requested licence', async () => {
        expect(licenceLoader.load.calledWith('test-licence-number')).to.be.true();
      });
    });

    experiment('when the licence import fails', () => {
      const err = new Error('Oops!');

      const job = {
        name: 'import.licence',
        data: {
          licenceNumber: 'test-licence-number'
        }
      };

      beforeEach(async () => {
        assertImportTableExists.assertImportTableExists.throws(err);
      });

      test('logs an error message', async () => {
        const func = () => importLicence.handler(job);
        await expect(func()).to.reject();
        expect(logger.error.calledWith(
          'Error handling job import.licence', err, { licenceNumber: 'test-licence-number' }
        )).to.be.true();
      });

      test('rethrows the error', async () => {
        const func = () => importLicence.handler(job);
        const err = await expect(func()).to.reject();
        expect(err.message).to.equal('Oops!');
      });
    });
  });
});
