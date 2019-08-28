const Lab = require('@hapi/lab');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const { experiment, test, beforeEach, afterEach } = exports.lab = Lab.script();
const { expect } = require('@hapi/code');

const returnsQueries = require('../../../../src/modules/import/lib/nald-returns-queries');
const db = require('../../../../src/modules/import/lib/db');

experiment('returns queries', () => {
  beforeEach(async () => {
    sandbox.stub(db, 'dbQuery').resolves([]);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('getReturnVersionReason', () => {
    test('performs DB query with correct parameters', async () => {
      await returnsQueries.getReturnVersionReason('licence_1', 'region_1', 100);
      const [query, params] = db.dbQuery.lastCall.args;
      expect(query).to.be.a.string();
      expect(params).to.equal(['licence_1', 100, 'region_1']);
    });

    test('resolves with array data', async () => {
      const result = await returnsQueries.getReturnVersionReason('licence_1', 'region_1', 100);
      expect(result).to.be.an.array();
    });
  });
});
