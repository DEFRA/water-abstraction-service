'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const repos = require('../../../../src/lib/connectors/repos');
const chargeVersionService = require('../../../../src/modules/billing/services/charge-version-service');

const Batch = require('../../../../src/lib/models/batch');
const Region = require('../../../../src/lib/models/region');
const FinancialYear = require('../../../../src/lib/models/financial-year');

const createBatch = (type = 'annual') => {
  const batch = new Batch(uuid());
  return batch.fromHash({
    region: new Region(uuid()),
    startYear: new FinancialYear(2016),
    endYear: new FinancialYear(2020),
    season: 'summer',
    type
  });
};

experiment('modules/billing/services/charge-version-service', () => {
  let batch;

  beforeEach(async () => {
    sandbox.stub(repos.billingBatchChargeVersions, 'createAnnual');
    sandbox.stub(repos.billingBatchChargeVersions, 'createSupplementary');
    sandbox.stub(repos.billingBatchChargeVersions, 'createTwoPartTariff');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.createForBatch', () => {
    experiment('for a supplementary batch', async () => {
      beforeEach(async () => {
        batch = createBatch('supplementary');
        await chargeVersionService.createForBatch(batch);
      });

      test('calls the repo .createSupplementary() method', async () => {
        expect(repos.billingBatchChargeVersions.createSupplementary.called).to.be.true();
      });

      test('calls .createSupplementary() with correct params', async () => {
        const [params] = repos.billingBatchChargeVersions.createSupplementary.lastCall.args;
        expect(params.billingBatchId).to.equal(batch.id);
        expect(params.regionId).to.equal(batch.region.id);
        expect(params.fromFinancialYearEnding).to.equal(2016);
        expect(params.toFinancialYearEnding).to.equal(2020);
        expect(params.season).to.equal('summer');
      });
    });

    experiment('for an annual batch', async () => {
      beforeEach(async () => {
        batch = createBatch('annual');
        await chargeVersionService.createForBatch(batch);
      });

      test('calls the repo .createAnnual() method', async () => {
        expect(repos.billingBatchChargeVersions.createAnnual.called).to.be.true();
      });
    });

    experiment('for a two-part tariff batch', async () => {
      beforeEach(async () => {
        batch = createBatch('two_part_tariff');
        await chargeVersionService.createForBatch(batch);
      });

      test('calls the repo .createAnnual() method', async () => {
        expect(repos.billingBatchChargeVersions.createTwoPartTariff.called).to.be.true();
      });
    });
  });
});
