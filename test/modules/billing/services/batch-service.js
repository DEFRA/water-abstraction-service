const moment = require('moment');
const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const { Batch, FinancialYear, Invoice, InvoiceLicence, Transaction } = require('../../../../src/lib/models');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const newRepos = require('../../../../src/lib/connectors/repos');
const chargeModuleBatchConnector = require('../../../../src/lib/connectors/charge-module/batches');
const repos = require('../../../../src/lib/connectors/repository');

const invoiceService = require('../../../../src/modules/billing/services/invoice-service');
const invoiceLicencesService = require('../../../../src/modules/billing/services/invoice-licences-service');
const transactionsService = require('../../../../src/modules/billing/services/transactions-service');

const BATCH_ID = '6556baab-4e69-4bba-89d8-7c6403f8ac8d';

const region = {
  regionId: '3e91fd44-dead-4748-a312-83806245c3da',
  chargeRegionId: 'A',
  naldRegionId: 1,
  name: 'Anglian'
};

const batch = {
  billingBatchId: BATCH_ID,
  batchType: 'supplementary',
  season: 'summer',
  fromFinancialYearEnding: 2014,
  toFinancialYearEnding: 2019,
  status: 'processing',
  dateCreated: (new Date()).toISOString(),
  region
};

const data = {
  region,
  batch
};

experiment('modules/billing/services/batch-service', () => {
  let result;

  beforeEach(async () => {
    sandbox.stub(newRepos.billingBatches, 'findOne').resolves(data.batch);
    sandbox.stub(newRepos.billingBatches, 'findPage').resolves();

    sandbox.stub(repos.billingBatches, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingBatchChargeVersions, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingBatchChargeVersionYears, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingInvoices, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingInvoiceLicences, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingTransactions, 'deleteByBatchId').resolves();

    sandbox.stub(chargeModuleBatchConnector, 'deleteBatch').resolves();

    sandbox.stub(transactionsService, 'saveTransactionToDB');
    sandbox.stub(invoiceLicencesService, 'saveInvoiceLicenceToDB');
    sandbox.stub(invoiceService, 'saveInvoiceToDB');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBatchById', () => {
    beforeEach(async () => {
      result = await batchService.getBatchById(BATCH_ID);
    });

    test('calls repos.billingBatches.getById with correct ID', async () => {
      const { args } = newRepos.billingBatches.findOne.lastCall;
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
        expect(result.type).to.equal(data.batch.batchType);
      });

      test('with correct season', async () => {
        expect(result.season).to.equal(data.batch.season);
      });

      experiment('with start year', () => {
        test('that is an instance of FinancialYear', async () => {
          expect(result.startYear instanceof FinancialYear).to.be.true();
        });

        test('with the correct date range', async () => {
          expect(result.startYear.yearEnding).to.equal(data.batch.fromFinancialYearEnding);
        });
      });

      experiment('with end year', () => {
        test('that is an instance of FinancialYear', async () => {
          expect(result.endYear instanceof FinancialYear).to.be.true();
        });

        test('with the correct date range', async () => {
          expect(result.endYear.yearEnding).to.equal(data.batch.toFinancialYearEnding);
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
      response = {
        data: [
          {
            billingBatchId: 'a9e9334e-4709-4b86-9b75-19e58f3f0d8c',
            region,
            batchType: 'supplementary',
            season: 'all year',
            dateCreated: '2020-01-09T16:23:24.753Z',
            dateUpdated: '2020-01-09T16:23:32.631Z',
            status: 'complete',
            fromFinancialYearEnding: 2014,
            toFinancialYearEnding: 2020
          },
          {
            billingBatchId: 'b08b07e0-8467-4e43-888f-a23d08c98a28',
            region,
            batchType: 'supplementary',
            season: 'all year',
            dateCreated: '2020-01-09T16:11:09.981Z',
            dateUpdated: '2020-01-09T16:11:17.077Z',
            status: 'review',
            fromFinancialYearEnding: 2014,
            toFinancialYearEnding: 2020
          }
        ],
        pagination: {
          page: 1,
          pageCount: 1,
          perPage: 9007199254740991,
          totalRows: 1
        }
      };

      newRepos.billingBatches.findPage.resolves(response);
    });

    test('calls the batch repository with default page/perPage pagination values', async () => {
      await batchService.getBatches();
      const [page, perPage] = newRepos.billingBatches.findPage.lastCall.args;
      expect(page).to.equal(1);
      expect(perPage).to.equal(Number.MAX_SAFE_INTEGER);
    });

    test('calls the batch repository with custom page pagination value', async () => {
      await batchService.getBatches(4);
      const [page, perPage] = newRepos.billingBatches.findPage.lastCall.args;
      expect(page).to.equal(4);
      expect(perPage).to.equal(Number.MAX_SAFE_INTEGER);
    });

    test('can use custom pagination values', async () => {
      await batchService.getBatches(5, 25);
      const [page, perPage] = newRepos.billingBatches.findPage.lastCall.args;
      expect(page).to.equal(5);
      expect(perPage).to.equal(25);
    });

    test('formats the batches', async () => {
      const { data: batches } = await batchService.getBatches();

      expect(batches[0]).to.be.instanceOf(Batch);
      expect(batches[0].id).to.equal(response.data[0].billingBatchId);
      expect(batches[0].type).to.equal(response.data[0].batchType);
      expect(batches[0].season).to.equal(response.data[0].season);
      expect(batches[0].startYear.yearEnding).to.equal(response.data[0].fromFinancialYearEnding);
      expect(batches[0].endYear.yearEnding).to.equal(response.data[0].toFinancialYearEnding);
      expect(batches[0].status).to.equal(response.data[0].status);
      expect(batches[0].dateCreated).to.equal(moment(response.data[0].dateCreated));
      expect(batches[0].region.id).to.equal(response.data[0].region.regionId);

      expect(batches[1]).to.be.instanceOf(Batch);
      expect(batches[1].id).to.equal(response.data[1].billingBatchId);
      expect(batches[1].type).to.equal(response.data[1].batchType);
      expect(batches[1].season).to.equal(response.data[1].season);
      expect(batches[1].startYear.yearEnding).to.equal(response.data[1].fromFinancialYearEnding);
      expect(batches[1].endYear.yearEnding).to.equal(response.data[1].toFinancialYearEnding);
      expect(batches[1].status).to.equal(response.data[1].status);
      expect(batches[1].dateCreated).to.equal(moment(response.data[1].dateCreated));
      expect(batches[1].region.id).to.equal(response.data[1].region.regionId);
    });

    test('includes a pagination object', async () => {
      const { pagination } = await batchService.getBatches();
      expect(pagination).to.equal(response.pagination);
    });
  });

  experiment('.deleteBatch', () => {
    let batchId;
    beforeEach(async () => {
      batchId = uuid();
      await batchService.deleteBatch(batchId);
    });

    test('delete the batch at the charge module', async () => {
      expect(chargeModuleBatchConnector.deleteBatch.called).to.be.true();
    });

    test('deletes the charge version years', async () => {
      expect(repos.billingBatchChargeVersionYears.deleteByBatchId.calledWith(batchId)).to.be.true();
    });

    test('deletes the charge versions', async () => {
      expect(repos.billingBatchChargeVersions.deleteByBatchId.calledWith(batchId)).to.be.true();
    });

    test('deletes the transactions', async () => {
      expect(repos.billingTransactions.deleteByBatchId.calledWith(batchId)).to.be.true();
    });

    test('deletes the invoice licences', async () => {
      expect(repos.billingInvoiceLicences.deleteByBatchId.calledWith(batchId)).to.be.true();
    });

    test('deletes the invoices', async () => {
      expect(repos.billingInvoices.deleteByBatchId.calledWith(batchId)).to.be.true();
    });

    test('deletes the batch', async () => {
      expect(repos.billingBatches.deleteByBatchId.calledWith(batchId)).to.be.true();
    });
  });

  experiment('.setErrorStatus', () => {
    beforeEach(async () => {
      sandbox.stub(newRepos.billingBatches, 'update');
      await batchService.setErrorStatus('batch-id');
    });

    test('calls billingBatches.update() with correct params', async () => {
      const [id, data] = newRepos.billingBatches.update.lastCall.args;
      expect(id).to.equal('batch-id');
      expect(data).to.equal({ status: 'error' });
    });
  });

  experiment('.saveInvoicesToDB', () => {
    let batch;

    const billingTransactionId = '0dcd5a7e-1971-4399-a8b5-0c3a10de0e77';
    const billingInvoiceLicenceId = '4c25c4e1-d66a-4860-b9a8-f8be1e278204';
    const billingInvoiceId = '51f4ab6f-431c-4ffe-9609-d1da706aa11b';

    const createBatch = () => {
      const batch = new Batch();
      batch.invoices = [
        new Invoice()
      ];
      batch.invoices[0].invoiceLicences = [
        new InvoiceLicence()
      ];
      batch.invoices[0].invoiceLicences[0].transactions = [
        new Transaction()
      ];
      return batch;
    };

    beforeEach(async () => {
      transactionsService.saveTransactionToDB.resolves({ billingTransactionId });
      invoiceLicencesService.saveInvoiceLicenceToDB.resolves({ billingInvoiceLicenceId });
      invoiceService.saveInvoiceToDB.resolves({ billingInvoiceId });

      batch = createBatch();
      await batchService.saveInvoicesToDB(batch);
    });

    test('each invoice in the batch is saved', async () => {
      expect(
        invoiceService.saveInvoiceToDB.calledWith(batch, batch.invoices[0])
      ).to.be.true();
    });

    test('the invoice model is updated with the returned ID', async () => {
      expect(batch.invoices[0].id).to.equal(billingInvoiceId);
    });

    test('each invoice licence in the batch is saved', async () => {
      expect(
        invoiceLicencesService.saveInvoiceLicenceToDB.calledWith(batch.invoices[0], batch.invoices[0].invoiceLicences[0])
      ).to.be.true();
    });

    test('the invoice licence model is updated with the returned ID', async () => {
      expect(batch.invoices[0].invoiceLicences[0].id).to.equal(billingInvoiceLicenceId);
    });

    test('each transaction in the batch is saved', async () => {
      expect(
        transactionsService.saveTransactionToDB.calledWith(
          batch.invoices[0].invoiceLicences[0],
          batch.invoices[0].invoiceLicences[0].transactions[0]
        )
      ).to.be.true();
    });

    test('the transaction model is updated with the returned ID', async () => {
      expect(batch.invoices[0].invoiceLicences[0].transactions[0].id).to.equal(billingTransactionId);
    });
  });
});
