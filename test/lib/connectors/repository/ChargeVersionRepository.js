'use strict';

const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const ChargeVersionRepository = require('../../../../src/lib/connectors/repository/ChargeVersionRepository');

const repo = new ChargeVersionRepository();

const chargeVersions = [{
  charge_version_id: 'version_1'
}, {
  charge_version_id: 'version_2'
}];

experiment('lib/connectors/repository/ChargeVersionRepository.js', () => {
  beforeEach(async () => {
    sandbox.stub(ChargeVersionRepository.prototype, 'find');
    sandbox.stub(ChargeVersionRepository.prototype, 'dbQuery');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.findByLicenceRef', () => {
    let result;
    const licenceRef = '01/123';

    beforeEach(async () => {
      ChargeVersionRepository.prototype.find.resolves({
        rows: chargeVersions
      });
      result = await repo.findByLicenceRef(licenceRef);
    });

    test('filters charge versions by licence number', async () => {
      const [filter] = ChargeVersionRepository.prototype.find.lastCall.args;
      expect(filter).to.equal({
        licence_ref: licenceRef
      });
    });

    test('sorts charge versions by start date', async () => {
      const [, sort] = ChargeVersionRepository.prototype.find.lastCall.args;
      expect(sort).to.equal({
        start_date: +1
      });
    });

    test('resolves with charge versions', async () => {
      expect(result).to.equal(chargeVersions);
    });
  });

  experiment('.findOneById', () => {
    let result;
    const chargeVersionId = 'version_1';

    beforeEach(async () => {
      ChargeVersionRepository.prototype.dbQuery.resolves({
        rows: [chargeVersions[0]]
      });
      result = await repo.findOneById(chargeVersionId);
    });

    test('filters charge versions by charge version ID', async () => {
      const [, params] = ChargeVersionRepository.prototype.dbQuery.lastCall.args;
      expect(params[0]).to.equal(chargeVersionId);
    });

    test('resolves with charge version', async () => {
      expect(result).to.equal(chargeVersions[0]);
    });
  });

  /*
  experiment('.createSupplementaryChargeVersions', () => {
    let batch;
    let now;
    let result;

    beforeEach(async () => {
      ChargeVersionRepository.prototype.dbQuery.resolves({
        rows: [{ id: 'test-row-1' }]
      });

      batch = {
        billing_batch_id: 'test-batch-id',
        region_id: 'test-region-id'
      };

      now = new Date(2019, 11, 8);
      result = await repo.createSupplementaryChargeVersions(batch, now);
    });

    test('passes the batch id as the first param', async () => {
      const [, [batchId]] = repo.dbQuery.lastCall.args;
      expect(batchId).to.equal(batch.billing_batch_id);
    });

    test('passes the region id as the second param', async () => {
      const [, [, regionId]] = repo.dbQuery.lastCall.args;
      expect(regionId).to.equal(batch.region_id);
    });

    test('passes the start of the financial year, six years ago', async () => {
      const [, [, , fromDate]] = repo.dbQuery.lastCall.args;
      expect(fromDate).to.equal('2013-04-01');
    });

    test('returns the affected database rows', async () => {
      expect(result).to.equal([{ id: 'test-row-1' }]);
    });
  });
  */

  /*
  experiment('.createTwoPartTariffChargeVersions', () => {
    let batch;
    let now;
    let result;

    beforeEach(async () => {
      ChargeVersionRepository.prototype.dbQuery.resolves({
        rows: [{ id: 'test-row-1' }]
      });

      batch = {
        billing_batch_id: 'test-batch-id',
        region_id: 'test-region-id',
        season: CHARGE_SEASON.summer
      };

      now = new Date(2019, 11, 8);
      result = await repo.createTwoPartTariffChargeVersions(batch, now);
    });

    test('passes the batch id as the first param', async () => {
      const [, [batchId]] = repo.dbQuery.lastCall.args;
      expect(batchId).to.equal(batch.billing_batch_id);
    });

    test('passes the region id as the second param', async () => {
      const [, [, regionId]] = repo.dbQuery.lastCall.args;
      expect(regionId).to.equal(batch.region_id);
    });

    test('passes the start of the financial year', async () => {
      const [, [, , fromDate]] = repo.dbQuery.lastCall.args;
      expect(fromDate).to.equal('2019-04-01');
    });

    test('returns the affected database rows', async () => {
      expect(result).to.equal([{ id: 'test-row-1' }]);
    });
  });
  */

  /*
  experiment('.createAnnualChargeVersions', () => {
    let batch;
    let result;

    beforeEach(async () => {
      ChargeVersionRepository.prototype.dbQuery.resolves({
        rows: [{ id: 'test-row-1' }]
      });

      batch = {
        billing_batch_id: 'test-batch-id',
        region_id: 'test-region-id'
      };

      const now = new Date(2020, 1, 21);
      result = await repo.createAnnualChargeVersions(batch, now);
    });

    test('passes the batch id as the first param', async () => {
      const [, [batchId]] = repo.dbQuery.lastCall.args;
      expect(batchId).to.equal(batch.billing_batch_id);
    });

    test('passes the region id as the second param', async () => {
      const [, [, regionId]] = repo.dbQuery.lastCall.args;
      expect(regionId).to.equal(batch.region_id);
    });

    test('passes the start of the financial year', async () => {
      const [, [, , fromDate]] = repo.dbQuery.lastCall.args;
      expect(fromDate).to.equal('2019-04-01');
    });

    test('returns the affected database rows', async () => {
      expect(result).to.equal([{ id: 'test-row-1' }]);
    });
  });
  */
});
