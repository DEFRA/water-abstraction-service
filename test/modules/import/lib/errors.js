const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');

const errors = require('../../../../src/modules/import/lib/errors');

experiment('modules/import/lib/errors', () => {
  let err;

  experiment('LicenceNotFoundError', () => {
    beforeEach(async () => {
      err = new errors.LicenceNotFoundError('oops');
    });
    test('has the correct name', async () => {
      expect(err.name).to.equal('LicenceNotFoundError');
    });

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops');
    });
  });

  experiment('MetaDataError', () => {
    beforeEach(async () => {
      err = new errors.MetaDataError('oops');
    });
    test('has the correct name', async () => {
      expect(err.name).to.equal('MetaDataError');
    });

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops');
    });
  });

  experiment('NALDImportTablesError', () => {
    beforeEach(async () => {
      err = new errors.NALDImportTablesError('oops');
    });
    test('has the correct name', async () => {
      expect(err.name).to.equal('NALDImportTablesError');
    });

    test('has the correct message', async () => {
      expect(err.message).to.equal('oops');
    });
  });
});
