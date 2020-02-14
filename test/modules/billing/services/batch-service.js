'use strict';

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

const { Batch, FinancialYear, Invoice, InvoiceLicence, Licence, Transaction, InvoiceAccount, Region, Totals } = require('../../../../src/lib/models');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const event = require('../../../../src/lib/event');
const { logger } = require('../../../../src/logger');

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
    sandbox.stub(logger, 'error');

    sandbox.stub(newRepos.billingBatches, 'findOne').resolves(data.batch);
    sandbox.stub(newRepos.billingBatches, 'findPage').resolves();
    sandbox.stub(newRepos.billingBatches, 'update').resolves();
    sandbox.stub(newRepos.billingBatches, 'delete').resolves();

    sandbox.stub(repos.billingBatchChargeVersions, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingBatchChargeVersionYears, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingInvoices, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingInvoiceLicences, 'deleteByBatchId').resolves();
    sandbox.stub(repos.billingTransactions, 'deleteByBatchId').resolves();

    sandbox.stub(transactionsService, 'saveTransactionToDB');

    sandbox.stub(invoiceLicencesService, 'saveInvoiceLicenceToDB');

    sandbox.stub(invoiceService, 'saveInvoiceToDB');

    sandbox.stub(chargeModuleBatchConnector, 'delete').resolves();
    sandbox.stub(chargeModuleBatchConnector, 'approve').resolves();
    sandbox.stub(chargeModuleBatchConnector, 'send').resolves();

    sandbox.stub(event, 'save').resolves();
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

    experiment('when no batch is found', () => {
      beforeEach(async () => {
        newRepos.billingBatches.findOne.resolves(null);
        result = await batchService.getBatchById(BATCH_ID);
      });
      test('resolves null', async () => {
        expect(result).to.be.null();
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
            status: 'ready',
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
    let batch;
    let internalCallingUser;

    beforeEach(async () => {
      batch = {
        batchId: batchId = uuid(),
        region: {
          code: 'A'
        }
      };

      internalCallingUser = {
        email: 'test@example.com',
        id: 1234
      };
    });

    experiment('when all deletions succeed', () => {
      beforeEach(async () => {
        await batchService.deleteBatch(batch, internalCallingUser);
      });

      test('delete the batch at the charge module', async () => {
        const [code, batchId] = chargeModuleBatchConnector.delete.lastCall.args;
        expect(code).to.equal('A');
        expect(batchId).to.equal(batchId);
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
        expect(newRepos.billingBatches.delete.calledWith(batchId)).to.be.true();
      });

      test('creates an event showing the calling user successfully deleted the batch', async () => {
        const [savedEvent] = event.save.lastCall.args;
        expect(savedEvent.issuer).to.equal(internalCallingUser.email);
        expect(savedEvent.type).to.equal('billing-batch:cancel');
        expect(savedEvent.status).to.equal('delete');
        expect(savedEvent.metadata.user).to.equal(internalCallingUser);
        expect(savedEvent.metadata.batch).to.equal(batch);
      });
    });

    experiment('when the batch does not delete', () => {
      let err;
      beforeEach(async () => {
        err = new Error('whoops');
        chargeModuleBatchConnector.delete.rejects(err);
        try {
          await batchService.deleteBatch(batch, internalCallingUser);
        } catch (err) {

        }
      });

      test('the error is logged', async () => {
        const [message, error, batch] = logger.error.lastCall.args;
        expect(message).to.equal('Failed to delete the batch');
        expect(error).to.equal(err);
        expect(batch).to.equal(batch);
      });

      test('creates an event showing the calling user could not delete the batch', async () => {
        const [savedEvent] = event.save.lastCall.args;
        expect(savedEvent.issuer).to.equal(internalCallingUser.email);
        expect(savedEvent.type).to.equal('billing-batch:cancel');
        expect(savedEvent.status).to.equal('error');
        expect(savedEvent.metadata.user).to.equal(internalCallingUser);
        expect(savedEvent.metadata.batch).to.equal(batch);
      });

      test('sets the status of the batch to error', async () => {
        const [id, changes] = newRepos.billingBatches.update.lastCall.args;
        expect(id).to.equal(batch.batchId);
        expect(changes).to.equal({
          status: 'error'
        });
      });
    });
  });

  experiment('.setStatus', () => {
    beforeEach(async () => {
      await batchService.setStatus(BATCH_ID, 'sent');
    });

    test('passes the batch id to the repo function', async () => {
      const [batchId] = newRepos.billingBatches.update.lastCall.args;
      expect(batchId).to.equal(BATCH_ID);
    });

    test('passes the new status repo function', async () => {
      const [, changes] = newRepos.billingBatches.update.lastCall.args;
      expect(changes).to.equal({
        status: 'sent'
      });
    });
  });

  experiment('.approveBatch', () => {
    let batchId;
    let batch;
    let internalCallingUser;

    beforeEach(async () => {
      batchId = uuid();
      batch = {
        batchId,
        region: {
          code: 'A'
        }
      };

      internalCallingUser = {
        email: 'test@example.com',
        id: 1234
      };
    });

    experiment('when the approval succeeds', () => {
      beforeEach(async () => {
        await batchService.approveBatch(batch, internalCallingUser);
      });

      test('approves the batch at the charge module', async () => {
        const [code, batchId] = chargeModuleBatchConnector.approve.lastCall.args;
        expect(code).to.equal('A');
        expect(batchId).to.equal(batchId);
      });

      test('sends the batch at the charge module', async () => {
        const [code, batchId, isDraft] = chargeModuleBatchConnector.send.lastCall.args;
        expect(code).to.equal('A');
        expect(batchId).to.equal(batchId);
        expect(isDraft).to.be.false();
      });

      test('creates an event showing the calling user successfully approved the batch', async () => {
        const [savedEvent] = event.save.lastCall.args;
        expect(savedEvent.issuer).to.equal(internalCallingUser.email);
        expect(savedEvent.type).to.equal('billing-batch:approve');
        expect(savedEvent.status).to.equal('sent');
        expect(savedEvent.metadata.user).to.equal(internalCallingUser);
        expect(savedEvent.metadata.batch).to.equal(batch);
      });

      test('sets the status of the batch to sent', async () => {
        const [id, changes] = newRepos.billingBatches.update.lastCall.args;
        expect(id).to.equal(batch.batchId);
        expect(changes).to.equal({
          status: 'sent'
        });
      });
    });

    experiment('when the batch does not approve', () => {
      let err;
      beforeEach(async () => {
        err = new Error('whoops');
        chargeModuleBatchConnector.send.rejects(err);
        try {
          await batchService.approveBatch(batch, internalCallingUser);
        } catch (err) {
        }
      });

      test('the error is logged', async () => {
        const [message, error, batch] = logger.error.lastCall.args;
        expect(message).to.equal('Failed to approve the batch');
        expect(error).to.equal(err);
        expect(batch).to.equal(batch);
      });

      test('creates an event showing the calling user could not approve the batch', async () => {
        const [savedEvent] = event.save.lastCall.args;
        expect(savedEvent.issuer).to.equal(internalCallingUser.email);
        expect(savedEvent.type).to.equal('billing-batch:approve');
        expect(savedEvent.status).to.equal('error');
        expect(savedEvent.metadata.user).to.equal(internalCallingUser);
        expect(savedEvent.metadata.batch).to.equal(batch);
      });

      test('sets the status of the batch to error', async () => {
        const [id, changes] = newRepos.billingBatches.update.lastCall.args;
        expect(id).to.equal(batch.batchId);
        expect(changes).to.equal({
          status: 'error'
        });
      });
    });
  });

  experiment('.setErrorStatus', () => {
    beforeEach(async () => {
      await batchService.setErrorStatus('batch-id');
    });

    test('calls billingBatches.update() with correct params', async () => {
      const [id, data] = newRepos.billingBatches.update.lastCall.args;
      expect(id).to.equal('batch-id');
      expect(data).to.equal({ status: 'error' });
    });
  });

  experiment('.saveInvoicesToDB', () => {
    let models;

    const billingTransactionId = '0dcd5a7e-1971-4399-a8b5-0c3a10de0e77';
    const billingInvoiceLicenceId = '4c25c4e1-d66a-4860-b9a8-f8be1e278204';
    const billingInvoiceId = '51f4ab6f-431c-4ffe-9609-d1da706aa11b';

    const createModels = () => {
      const batch = new Batch();
      const invoice = new Invoice();
      const invoiceAccount = new InvoiceAccount();
      invoice.invoiceAccount = invoiceAccount;
      batch.invoices = [invoice];
      const invoiceLicence = new InvoiceLicence();
      const licence = new Licence();
      invoiceLicence.licence = licence;
      invoice.invoiceLicences = [invoiceLicence];
      const transaction = new Transaction();
      invoiceLicence.transactions = [transaction];

      return { batch, invoice, invoiceLicence, licence, transaction, invoiceAccount };
    };

    beforeEach(async () => {
      transactionsService.saveTransactionToDB.resolves({ billingTransactionId });
      invoiceLicencesService.saveInvoiceLicenceToDB.resolves({ billingInvoiceLicenceId });
      invoiceService.saveInvoiceToDB.resolves({ billingInvoiceId });

      models = createModels();
      sandbox.stub(models.transaction, 'createTransactionKey');
      await batchService.saveInvoicesToDB(models.batch);
    });

    test('each invoice in the batch is saved', async () => {
      expect(
        invoiceService.saveInvoiceToDB.calledWith(models.batch, models.invoice)
      ).to.be.true();
    });

    test('the invoice model is updated with the returned ID', async () => {
      expect(models.invoice.id).to.equal(billingInvoiceId);
    });

    test('each invoice licence in the batch is saved', async () => {
      expect(
        invoiceLicencesService.saveInvoiceLicenceToDB.calledWith(models.invoice, models.invoiceLicence)
      ).to.be.true();
    });

    test('the invoice licence model is updated with the returned ID', async () => {
      expect(models.invoiceLicence.id).to.equal(billingInvoiceLicenceId);
    });

    test('.createTransactionKey is called on each transaction', async () => {
      expect(models.transaction.createTransactionKey.calledWith(
        models.invoiceAccount, models.licence, models.batch
      ));
    });

    test('each transaction in the batch is saved', async () => {
      expect(
        transactionsService.saveTransactionToDB.calledWith(
          models.invoiceLicence,
          models.transaction
        )
      ).to.be.true();
    });

    test('the transaction model is updated with the returned ID', async () => {
      expect(models.transaction.id).to.equal(billingTransactionId);
    });
  });

  experiment('.decorateBatchWithTotals', () => {
    let batch;

    const summary = {
      creditNoteCount: 0,
      creditNoteValue: 0,
      invoiceCount: 3,
      invoiceValue: 15022872,
      creditLineCount: 0,
      creditLineValue: 0,
      debitLineCount: 15,
      debitLineValue: 15022872,
      netTotal: 15022872
    };

    beforeEach(async () => {
      chargeModuleBatchConnector.send.resolves({
        summary
      });
      batch = new Batch(uuid());
      batch.region = new Region();
      batch.region.code = 'A';
      await batchService.decorateBatchWithTotals(batch);
    });

    test('calls charge module batch API with correct params', async () => {
      const [regionCode, batchId, draft] = chargeModuleBatchConnector.send.lastCall.args;
      expect(regionCode).to.equal(batch.region.code);
      expect(batchId).to.equal(batch.id);
      expect(draft).to.equal(true);
    });

    test('adds a Totals instance to the batch', async () => {
      expect(batch.totals instanceof Totals).to.be.true();
    });

    test('copies totals correctly', async () => {
      expect(batch.totals.toJSON()).to.equal(summary);
    });
  });
});
