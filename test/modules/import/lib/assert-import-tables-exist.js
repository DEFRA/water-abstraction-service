const { afterEach, beforeEach, experiment, test } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const assertImportTablesExist = require('../../../../src/modules/import/lib/assert-import-tables-exist');
const naldQueries = require('../../../../src/modules/import/lib/nald-queries');
const { NALDImportTablesError } = require('../../../../src/modules/import/lib/errors');

experiment('modules/import/lib/assert-import-tables-exist', () => {
  beforeEach(async () => {
    sandbox.stub(naldQueries, 'importTableExists');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.assertImportTablesExist', () => {
    experiment('when tables exist', () => {
      beforeEach(async () => {
        naldQueries.importTableExists.resolves(true);
      });

      test('resolves undefined', async () => {
        const result = await assertImportTablesExist.assertImportTablesExist();
        expect(result).to.be.undefined();
      });
    });

    experiment('when tables do not exist', () => {
      beforeEach(async () => {
        naldQueries.importTableExists.resolves(false);
      });

      test('rejects with a NALDImportTablesError error', async () => {
        const func = () => assertImportTablesExist.assertImportTablesExist();
        const err = await expect(func()).to.reject();
        expect(err instanceof NALDImportTablesError);
      });
    });
  });
});
