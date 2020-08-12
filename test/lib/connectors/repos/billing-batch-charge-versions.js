'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const billingBatchChargeVersions = require('../../../../src/lib/connectors/repos/billing-batch-charge-versions');
const queries = require('../../../../src/lib/connectors/repos/queries/billing-batch-charge-versions');
const { BillingBatchChargeVersion } = require('../../../../src/lib/connectors/bookshelf');

const raw = require('../../../../src/lib/connectors/repos/lib/raw');

const getParams = (fromFinancialYearEnding = 2020) => ({
  fromFinancialYearEnding,
  billingBatchId: uuid(),
  regionId: uuid(),
  toFinancialYearEnding: 2020,
  isSummer: true
});

const response = [{
  billingBatchChargeVersionId: uuid(),
  chargeVersionId: uuid()
}];

experiment('lib/connectors/repos/billing-batch-charge-versions', () => {
  let result, params, stub;

  beforeEach(async () => {
    sandbox.stub(raw, 'multiRow').resolves(response);
    stub = {
      destroy: sandbox.stub().resolves(),
      where: sandbox.stub().returnsThis()
    };
    sandbox.stub(BillingBatchChargeVersion, 'forge').returns(stub);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createSupplementary', () => {
    beforeEach(async () => {
      params = getParams(2014);
      result = await billingBatchChargeVersions.createSupplementary(params);
    });

    test('uses the correct SQL query', async () => {
      const [query] = raw.multiRow.lastCall.args;
      expect(query).to.equal(queries.createSupplementary);
    });

    test('provides the parameters', async () => {
      const [, queryParams] = raw.multiRow.lastCall.args;
      expect(queryParams.billingBatchId).to.equal(params.billingBatchId);
      expect(queryParams.regionId).to.equal(params.regionId);
      expect(queryParams.fromFinancialYearEnding).to.equal(params.fromFinancialYearEnding);
      expect(queryParams.toFinancialYearEnding).to.equal(params.toFinancialYearEnding);
      expect(queryParams.isSummer).to.equal(params.isSummer);
      expect(queryParams.fromDate).to.equal('2013-04-01');
    });

    test('resolves with the DB rows', async () => {
      expect(result).to.equal(response);
    });
  });

  experiment('.createAnnual', () => {
    beforeEach(async () => {
      params = getParams();
      result = await billingBatchChargeVersions.createAnnual(params);
    });

    test('uses the correct SQL query', async () => {
      const [query] = raw.multiRow.lastCall.args;
      expect(query).to.equal(queries.createAnnual);
    });

    test('provides the parameters', async () => {
      const [, queryParams] = raw.multiRow.lastCall.args;
      expect(queryParams.billingBatchId).to.equal(params.billingBatchId);
      expect(queryParams.regionId).to.equal(params.regionId);
      expect(queryParams.fromFinancialYearEnding).to.equal(params.fromFinancialYearEnding);
      expect(queryParams.toFinancialYearEnding).to.equal(params.toFinancialYearEnding);
      expect(queryParams.isSummer).to.equal(params.isSummer);
      expect(queryParams.fromDate).to.equal('2019-04-01');
    });

    test('resolves with the DB rows', async () => {
      expect(result).to.equal(response);
    });
  });

  experiment('.createTwoPartTariff', () => {
    beforeEach(async () => {
      params = getParams();
      result = await billingBatchChargeVersions.createTwoPartTariff(params);
    });

    test('uses the correct SQL query', async () => {
      const [query] = raw.multiRow.lastCall.args;
      expect(query).to.equal(queries.createTwoPartTariff);
    });

    test('provides the parameters', async () => {
      const [, queryParams] = raw.multiRow.lastCall.args;
      expect(queryParams.billingBatchId).to.equal(params.billingBatchId);
      expect(queryParams.regionId).to.equal(params.regionId);
      expect(queryParams.fromFinancialYearEnding).to.equal(params.fromFinancialYearEnding);
      expect(queryParams.toFinancialYearEnding).to.equal(params.toFinancialYearEnding);
      expect(queryParams.isSummer).to.equal(params.isSummer);
      expect(queryParams.fromDate).to.equal('2019-04-01');
    });

    test('resolves with the DB rows', async () => {
      expect(result).to.equal(response);
    });
  });

  experiment('.deleteByBatchId', () => {
    const batchId = 'test-batch-id';

    beforeEach(async () => {
      await billingBatchChargeVersions.deleteByBatchId(batchId);
    });

    test('calls forge() on the model', async () => {
      expect(BillingBatchChargeVersion.forge.called).to.be.true();
    });

    test('calls where() with the correct params', async () => {
      const [params] = stub.where.lastCall.args;
      expect(params).to.equal({ billing_batch_id: batchId });
    });

    test('calls destroy() to delete found records', async () => {
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: true });
    });

    test('when deletion is not required, calls destroy() with the correct params', async () => {
      await billingBatchChargeVersions.deleteByBatchId(batchId, false);
      const [params] = stub.destroy.lastCall.args;
      expect(params).to.equal({ require: false });
    });
  });
});
