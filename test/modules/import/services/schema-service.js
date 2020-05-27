const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const moment = require('moment');
moment.locale('en-gb');

const constants = require('../../../../src/modules/import/lib/constants');
const schemaService = require('../../../../src/modules/import/services/schema-service');
const db = require('../../../../src/modules/import/lib/db');

experiment('modules/import/services/schema-service', () => {
  beforeEach(async () => {
    sandbox.stub(constants, 'SCHEMA_IMPORT').value('test_schema');
    sandbox.stub(constants, 'SCHEMA_TEMP').value('temp_schema');

    sandbox.stub(db, 'dbQuery');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.dropAndCreateSchema', () => {
    beforeEach(async () => {
      await schemaService.dropAndCreateSchema();
    });

    test('the schema is dropped', async () => {
      const [query] = db.dbQuery.firstCall.args;
      expect(query).to.equal('drop schema if exists test_schema cascade');
    });

    test('the schema is re-created', async () => {
      const [query] = db.dbQuery.secondCall.args;
      expect(query).to.equal('create schema if not exists test_schema');
    });
  });

  experiment('.swapTemporarySchema', () => {
    beforeEach(async () => {
      await schemaService.swapTemporarySchema('test_schema');
    });

    test('the schema is dropped', async () => {
      const [query] = db.dbQuery.firstCall.args;
      expect(query).to.equal('drop schema if exists test_schema cascade');
    });

    test('the schema is re-created', async () => {
      const [query] = db.dbQuery.secondCall.args;
      expect(query).to.equal('alter schema temp_schema rename to test_schema;');
    });
  });

  experiment('rename schema', () => {
    beforeEach(async () => {
      await schemaService.renameSchema('schema_old', 'schema_new');
    });

    test('the schema is renamed', async () => {
      const [query] = db.dbQuery.firstCall.args;
      expect(query).to.equal('alter schema schema_old rename to schema_new;');
    });
  });
});
