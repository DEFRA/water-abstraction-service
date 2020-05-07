const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const moment = require('moment');
moment.locale('en-gb');

const extractService = require('../../../../src/modules/import/services/extract-service');
const s3Service = require('../../../../src/modules/import/services/s3-service');
const zipService = require('../../../../src/modules/import/services/zip-service');
const schemaService = require('../../../../src/modules/import/services/schema-service');
const loadCsvService = require('../../../../src/modules/import/services/load-csv-service');

const helpers = require('../../../../src/lib/helpers');
const slack = require('../../../../src/lib/slack');
const { logger } = require('../../../../src/logger');

experiment('modules/import/services/extract-service', () => {
  beforeEach(async () => {
    sandbox.stub(helpers, 'execCommand');
    sandbox.stub(slack, 'post');
    sandbox.stub(logger, 'info');
    sandbox.stub(s3Service, 'download');
    sandbox.stub(zipService, 'extract');
    sandbox.stub(schemaService, 'dropAndCreateSchema');
    sandbox.stub(loadCsvService, 'importFiles');
    sandbox.stub(schemaService, 'swapTemporarySchema');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.downloadAndExtract', () => {
    beforeEach(async () => {
      await extractService.downloadAndExtract();
    });

    test('the steps are called in the correct order', async () => {
      sinon.assert.callOrder(
        helpers.execCommand,
        helpers.execCommand,
        helpers.execCommand,
        s3Service.download,
        zipService.extract,
        schemaService.dropAndCreateSchema,
        loadCsvService.importFiles,
        schemaService.swapTemporarySchema,
        helpers.execCommand,
        helpers.execCommand,
        helpers.execCommand
      );
    });

    const testMessage = (index, message) =>
      test(`${message} message is logged and posted to slack`, async () => {
        expect(logger.info.getCall(index).args[0]).to.equal(message);
        expect(slack.post.getCall(index).args[0]).to.equal(message);
      });

    testMessage(0, 'Import: preparing folders');
    testMessage(1, 'Import: downloading from s3');
    testMessage(2, 'Import: extracting files from zip');
    testMessage(3, 'Import: create import_temp schema');
    testMessage(4, 'Import: importing CSV files');
    testMessage(5, 'Import: swapping schema from import_temp to import');
    testMessage(6, 'Import: cleaning up local files');

    test('the correct schemas are used', async () => {
      expect(schemaService.dropAndCreateSchema.calledWith('import_temp')).to.be.true();
      expect(loadCsvService.importFiles.calledWith('import_temp')).to.be.true();
    });
  });

  experiment('.copyTestFiles', () => {
    beforeEach(async () => {
      await extractService.copyTestFiles();
    });

    test('the steps are called in the correct order', async () => {
      sinon.assert.callOrder(
        helpers.execCommand,
        helpers.execCommand,
        helpers.execCommand,
        schemaService.dropAndCreateSchema,
        helpers.execCommand,
        loadCsvService.importFiles
      );
    });

    test('the CSVs are copied from the correct location', async () => {
      expect(helpers.execCommand.getCall(3).args[0]).to.equal('cp ./test/dummy-csv/* temp/NALD');
    });
  });
});
