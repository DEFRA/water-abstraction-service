const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { logger } = require('../../../../src/logger');
const importLog = require('../../../../src/modules/import/lib/import-log.js');
const importLicenceComplete = require('../../../../src/modules/import/jobs/import-licence-complete');

experiment('modules/import/jobs/import-licence-complete', () => {
  beforeEach(async () => {
    sandbox.stub(logger, 'info');
    sandbox.stub(importLog, 'setImportStatus');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.options', () => {
    test('has teamSize set to 50', async () => {
      expect(importLicenceComplete.options.teamSize).to.equal(50);
    });
  });

  experiment('.handler', () => {
    experiment('when the licence import was successful', () => {
      const job = {
        failed: false,
        data: {
          request: {
            name: 'import.licence',
            data: {
              licenceNumber: 'test-licence-number'
            }
          }
        }
      };

      beforeEach(async () => {
        await importLicenceComplete.handler(job);
      });

      test('a message is logged', async () => {
        const [message, params] = logger.info.lastCall.args;
        expect(message).to.equal('Handling onComplete job: import.licence');
        expect(params).to.equal({
          licenceNumber: 'test-licence-number'
        });
      });

      test('the import status is set to completed', async () => {
        expect(importLog.setImportStatus.calledWith(
          'test-licence-number', 'OK', importLog.PENDING_JOB_STATUS.complete
        )).to.be.true();
      });
    });

    experiment('when the licence import failed', () => {
      const job = {
        failed: true,
        data: {
          request: {
            name: 'import.licence',
            data: {
              licenceNumber: 'test-licence-number'
            }
          }
        }
      };

      beforeEach(async () => {
        await importLicenceComplete.handler(job);
      });

      test('a message is logged', async () => {
        const [message, params] = logger.info.lastCall.args;
        expect(message).to.equal('Handling onComplete job: import.licence');
        expect(params).to.equal({
          licenceNumber: 'test-licence-number'
        });
      });

      test('the import status is set to completed', async () => {
        expect(importLog.setImportStatus.calledWith(
          'test-licence-number', 'Error', importLog.PENDING_JOB_STATUS.complete
        )).to.be.true();
      });
    });
  });
});
