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

const raw = require('../../../../src/lib/connectors/repos/lib/raw');

const getParams = (fromFinancialYearEnding = 2020) => ({
  fromFinancialYearEnding,
  billingBatchId: uuid(),
  regionId: uuid(),
  toFinancialYearEnding: 2020,
  season: 'summer'
});

const response = [{
  billingBatchChargeVersionId: uuid(),
  chargeVersionId: uuid()
}];

experiment('lib/connectors/repos/billing-batch-charge-versions', () => {
  let result, params;

  beforeEach(async () => {
    sandbox.stub(raw, 'multiRow').resolves(response);
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
      expect(queryParams.season).to.equal(params.season);
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
      expect(queryParams.season).to.equal(params.season);
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
      expect(queryParams.season).to.equal(params.season);
      expect(queryParams.fromDate).to.equal('2019-04-01');
    });

    test('resolves with the DB rows', async () => {
      expect(result).to.equal(response);
    });
  });
});
