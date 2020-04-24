const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const moment = require('moment');
moment.locale('en-gb');

const { logger } = require('../../../../src/logger');
const helpers = require('../../../../src/lib/helpers');
const config = require('../../../../config');

const zipService = require('../../../../src/modules/import/services/zip-service');

experiment('modules/import/services/zip-service', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'execCommand');
    sandbox.stub(logger, 'info');
    sandbox.stub(logger, 'error');

    sandbox.stub(config.import, 'zipPassword').value('test-password');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.extract', () => {
    experiment('when the zip commands succeed', () => {
      beforeEach(async () => {
        await zipService.extract();
      });

      test('logs an info message', async () => {
        expect(logger.info.calledWith('Extracting data from NALD zip file')).to.be.true();
      });

      test('the first call extracts the primary zip with password', async () => {
        const [cmd] = helpers.execCommand.firstCall.args;
        expect(cmd).to.equal('7z x temp/nald_dl.zip -o ./temp/ -p test-password');
      });

      test('the second call extracts the secondary zip without password', async () => {
        const [cmd] = helpers.execCommand.secondCall.args;
        expect(cmd).to.equal('7z x temp/NALD.zip -o ./temp/');
      });
    });

    experiment('when the zip commands fail', () => {
      const err = new Error('oops');

      beforeEach(async () => {
        helpers.execCommand.rejects(err);
      });

      test('an error is logged and rethrown', async () => {
        const func = () => zipService.extract();
        const result = await expect(func()).to.reject();
        expect(logger.error.calledWith('Could not extract NALD zip', err)).to.be.true();
        expect(result).to.equal(err);
      });
    });
  });
});
