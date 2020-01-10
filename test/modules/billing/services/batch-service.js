const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();

const { Batch, FinancialYear } = require('../../../../src/lib/models');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const repos = require('../../../../src/lib/connectors/repository');

const BATCH_ID = '6556baab-4e69-4bba-89d8-7c6403f8ac8d';

const data = {
  batch: {
    billing_batch_id: BATCH_ID,
    batch_type: 'supplementary',
    season: 'summer',
    from_financial_year_ending: 2014,
    to_financial_year_ending: 2019,
    status: 'processing'
  }
};

experiment('modules/billing/services/batch-service', () => {
  let result;

  beforeEach(async () => {
    sandbox.stub(repos.billingBatches, 'getById').resolves(data.batch);
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBatchById', () => {
    beforeEach(async () => {
      result = await batchService.getBatchById(BATCH_ID);
    });

    test('calls repos.billingBatches.getById with correct ID', async () => {
      const { args } = repos.billingBatches.getById.lastCall;
      expect(args).to.equal([BATCH_ID]);
    });

    experiment('returns a batch', () => {
      test('which is an instance of Batch', async () => {
        expect(result instanceof Batch).to.be.true();
      });

      test('with correct ID', async () => {
        expect(result.id).to.equal(BATCH_ID);
      });

      test('with correct type', async () => {
        expect(result.type).to.equal(data.batch.batch_type);
      });

      test('with correct season', async () => {
        expect(result.season).to.equal(data.batch.season);
      });

      experiment('with start year', () => {
        test('that is an instance of FinancialYear', async () => {
          expect(result.startYear instanceof FinancialYear).to.be.true();
        });

        test('with the correct date range', async () => {
          expect(result.startYear.yearEnding).to.equal(data.batch.from_financial_year_ending);
        });
      });

      experiment('with end year', () => {
        test('that is an instance of FinancialYear', async () => {
          expect(result.endYear instanceof FinancialYear).to.be.true();
        });

        test('with the correct date range', async () => {
          expect(result.endYear.yearEnding).to.equal(data.batch.to_financial_year_ending);
        });
      });

      test('with correct status', async () => {
        expect(result.status).to.equal(data.batch.status);
      });
    });
  });
});
