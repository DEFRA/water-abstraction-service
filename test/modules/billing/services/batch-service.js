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
    sandbox.stub(repos.billingBatches, 'find').resolves();
    sandbox.stub(repos.billingBatches, 'findRowCount').resolves();
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

  experiment('.getBatches', () => {
    let response;

    beforeEach(async () => {
      repos.billingBatches.findRowCount.resolves({
        rows: [
          { totalrowcount: 100 }
        ]
      });

      response = {
        rows: [
          {
            billing_batch_id: 'a9e9334e-4709-4b86-9b75-19e58f3f0d8c',
            region_id: '982c2beb-29d0-4491-95a4-ff716f2429de',
            batch_type: 'supplementary',
            season: 'all year',
            date_created: '2020-01-09T16:23:24.753Z',
            date_updated: '2020-01-09T16:23:32.631Z',
            status: 'complete',
            from_financial_year_ending: 2014,
            to_financial_year_ending: 2020
          },
          {
            billing_batch_id: 'b08b07e0-8467-4e43-888f-a23d08c98a28',
            region_id: '26333b8b-51ec-4046-8fb7-ae3a824ad2e4',
            batch_type: 'supplementary',
            season: 'all year',
            date_created: '2020-01-09T16:11:09.981Z',
            date_updated: '2020-01-09T16:11:17.077Z',
            status: 'review',
            from_financial_year_ending: 2014,
            to_financial_year_ending: 2020
          }
        ]
      };

      repos.billingBatches.find.resolves(response);
    });

    test('calls the batch repository with no filter to get all the batches', async () => {
      await batchService.getBatches();
      const [filter] = repos.billingBatches.find.lastCall.args;
      expect(filter).to.be.null();
    });

    test('calls the batch repository with a descending sort on date created', async () => {
      await batchService.getBatches();
      const [, sort] = repos.billingBatches.find.lastCall.args;
      expect(sort).to.equal({
        date_created: -1
      });
    });

    test('calls the batch repository with default pagination', async () => {
      await batchService.getBatches();
      const [, , pagination] = repos.billingBatches.find.lastCall.args;
      expect(pagination).to.equal({
        page: 1,
        perPage: Number.MAX_SAFE_INTEGER
      });
    });

    test('can use custom pagination values', async () => {
      await batchService.getBatches(2, 5);
      const [, , pagination] = repos.billingBatches.find.lastCall.args;
      expect(pagination).to.equal({
        page: 2,
        perPage: 5
      });
    });

    test('formats the batches', async () => {
      const { data: batches } = await batchService.getBatches();

      expect(batches[0]).to.be.instanceOf(Batch);
      expect(batches[0].id).to.equal(response.rows[0].billing_batch_id);
      expect(batches[0].type).to.equal(response.rows[0].batch_type);
      expect(batches[0].season).to.equal(response.rows[0].season);
      expect(batches[0].startYear.yearEnding).to.equal(response.rows[0].from_financial_year_ending);
      expect(batches[0].endYear.yearEnding).to.equal(response.rows[0].to_financial_year_ending);
      expect(batches[0].status).to.equal(response.rows[0].status);
      expect(batches[0].dateCreated).to.equal(response.rows[0].date_created);
      expect(batches[0].region.id).to.equal(response.rows[0].region_id);

      expect(batches[1]).to.be.instanceOf(Batch);
      expect(batches[1].id).to.equal(response.rows[1].billing_batch_id);
      expect(batches[1].type).to.equal(response.rows[1].batch_type);
      expect(batches[1].season).to.equal(response.rows[1].season);
      expect(batches[1].startYear.yearEnding).to.equal(response.rows[1].from_financial_year_ending);
      expect(batches[1].endYear.yearEnding).to.equal(response.rows[1].to_financial_year_ending);
      expect(batches[1].status).to.equal(response.rows[1].status);
      expect(batches[1].dateCreated).to.equal(response.rows[1].date_created);
      expect(batches[1].region.id).to.equal(response.rows[1].region_id);
    });

    test('includes a pagination object', async () => {
      const { pagination } = await batchService.getBatches(1, 10);
      expect(pagination.page).to.equal(1);
      expect(pagination.perPage).to.equal(10);
      expect(pagination.totalRows).to.equal(100);
      expect(pagination.pageCount).to.equal(10);
    });
  });
});
