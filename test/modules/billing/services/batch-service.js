'use strict';

const moment = require('moment');
const {
  experiment,
  test,
  beforeEach,
  afterEach,
  fail
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const Batch = require('../../../../src/lib/models/batch');
const FinancialYear = require('../../../../src/lib/models/financial-year');
const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceAccount = require('../../../../src/lib/models/invoice-account');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Licence = require('../../../../src/lib/models/licence');
const Transaction = require('../../../../src/lib/models/transaction');
const { BatchStatusError } = require('../../../../src/modules/billing/lib/errors');
const { NotFoundError } = require('../../../../src/lib/errors');

const eventService = require('../../../../src/lib/services/events');
const { logger } = require('../../../../src/logger');

const newRepos = require('../../../../src/lib/connectors/repos');
const chargeModuleBillRunConnector = require('../../../../src/lib/connectors/charge-module/bill-runs');

const batchService = require('../../../../src/modules/billing/services/batch-service');
const billingVolumesService = require('../../../../src/modules/billing/services/billing-volumes-service');
const invoiceAccountsService = require('../../../../src/lib/services/invoice-accounts-service');
const invoiceLicencesService = require('../../../../src/modules/billing/services/invoice-licences-service');
const invoiceService = require('../../../../src/modules/billing/services/invoice-service');
const licencesService = require('../../../../src/lib/services/licences');
const transactionsService = require('../../../../src/modules/billing/services/transactions-service');
const { createBatch } = require('../test-data/test-billing-data');
const config = require('../../../../config');

const REGION_ID = '3e91fd44-dead-4748-a312-83806245c3da';
const BATCH_ID = '6556baab-4e69-4bba-89d8-7c6403f8ac8d';

const region = {
  regionId: REGION_ID,
  chargeRegionId: 'A',
  naldRegionId: 1,
  name: 'Anglian',
  displayName: 'Anglian'
};

const batch = {
  billingBatchId: BATCH_ID,
  batchType: 'supplementary',
  isSummer: true,
  regionId: region.regionId,
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
    sandbox.stub(logger, 'info');

    sandbox.stub(newRepos.billingBatches, 'delete').resolves();
    sandbox.stub(newRepos.billingBatches, 'findOne').resolves(data.batch);
    sandbox.stub(newRepos.billingBatches, 'findOneWithInvoices').resolves();
    sandbox.stub(newRepos.billingBatches, 'findPage').resolves();
    sandbox.stub(newRepos.billingBatches, 'update').resolves();
    sandbox.stub(newRepos.billingBatches, 'create').resolves();
    sandbox.stub(newRepos.billingBatches, 'findOneWithInvoicesWithTransactions').resolves();
    sandbox.stub(newRepos.billingBatches, 'findByRegionId').resolves([]);
    sandbox.stub(newRepos.billingBatches, 'find').resolves();
    sandbox.stub(newRepos.billingBatches, 'deleteAllBillingData').resolves();

    sandbox.stub(newRepos.billingInvoices, 'deleteEmptyByBatchId').resolves();
    sandbox.stub(newRepos.billingInvoices, 'deleteByBatchId').resolves();

    sandbox.stub(newRepos.billingInvoiceLicences, 'deleteEmptyByBatchId').resolves();
    sandbox.stub(newRepos.billingInvoiceLicences, 'deleteByBatchId').resolves();

    sandbox.stub(newRepos.billingTransactions, 'findStatusCountsByBatchId').resolves();
    sandbox.stub(newRepos.billingTransactions, 'findByBatchId').resolves();
    sandbox.stub(newRepos.billingTransactions, 'deleteByBatchId').resolves();
    sandbox.stub(newRepos.billingTransactions, 'countByBatchId').resolves();

    sandbox.stub(newRepos.billingVolumes, 'deleteByBatchId').resolves();
    sandbox.stub(newRepos.billingVolumes, 'markVolumesAsErrored').resolves();

    sandbox.stub(newRepos.billingBatchChargeVersionYears, 'deleteByBatchId').resolves();

    sandbox.stub(transactionsService, 'saveTransactionToDB');
    sandbox.stub(transactionsService, 'persistDeMinimis').resolves();

    sandbox.stub(invoiceLicencesService, 'saveInvoiceLicenceToDB');

    sandbox.stub(invoiceService, 'saveInvoiceToDB');
    sandbox.stub(invoiceAccountsService, 'getByInvoiceAccountId');

    sandbox.stub(licencesService, 'updateIncludeInSupplementaryBillingStatus').resolves();
    sandbox.stub(licencesService, 'updateIncludeInSupplementaryBillingStatusForSentBatch').resolves();
    sandbox.stub(licencesService, 'updateIncludeInSupplementaryBillingStatusForUnsentBatch').resolves();

    sandbox.stub(chargeModuleBillRunConnector, 'create').resolves();
    sandbox.stub(chargeModuleBillRunConnector, 'get').resolves();
    sandbox.stub(chargeModuleBillRunConnector, 'delete').resolves();
    sandbox.stub(chargeModuleBillRunConnector, 'approve').resolves();
    sandbox.stub(chargeModuleBillRunConnector, 'send').resolves();
    sandbox.stub(chargeModuleBillRunConnector, 'removeCustomerInFinancialYear').resolves();
    sandbox.stub(chargeModuleBillRunConnector, 'getTransactions').resolves();
    sandbox.stub(chargeModuleBillRunConnector, 'getCustomerTransactions').resolves();

    sandbox.stub(eventService, 'create').resolves();

    sandbox.stub(newRepos.billingInvoices, 'findOne');
    sandbox.stub(newRepos.billingBatchChargeVersionYears, 'deleteByInvoiceId');
    sandbox.stub(newRepos.billingVolumes, 'deleteByBatchAndInvoiceId');
    sandbox.stub(newRepos.billingTransactions, 'deleteByInvoiceId');
    sandbox.stub(newRepos.billingInvoiceLicences, 'deleteByInvoiceId');
    sandbox.stub(newRepos.billingInvoices, 'delete');

    sandbox.stub(billingVolumesService, 'approveVolumesForBatch');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getBatchById', () => {
    beforeEach(async () => {
      result = await batchService.getBatchById(BATCH_ID);
    });

    test('calls repos.billingBatches.findOne with correct ID', async () => {
      const { args } = newRepos.billingBatches.findOne.lastCall;
      expect(args).to.equal([BATCH_ID]);
    });

    test('calls repos.billingBatches.findOneWithInvoices with correct ID if includeInvoices is true', async () => {
      await batchService.getBatchById(BATCH_ID, true);
      const { args } = newRepos.billingBatches.findOneWithInvoices.lastCall;
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

      test('with correct isSummer flag', async () => {
        expect(result.isSummer).to.equal(data.batch.isSummer);
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
            isSummer: false,
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
            isSummer: false,
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
      expect(batches[0].isSummer).to.equal(response.data[0].isSummer);
      expect(batches[0].startYear.yearEnding).to.equal(response.data[0].fromFinancialYearEnding);
      expect(batches[0].endYear.yearEnding).to.equal(response.data[0].toFinancialYearEnding);
      expect(batches[0].status).to.equal(response.data[0].status);
      expect(batches[0].dateCreated).to.equal(moment(response.data[0].dateCreated));
      expect(batches[0].region.id).to.equal(response.data[0].region.regionId);

      expect(batches[1]).to.be.instanceOf(Batch);
      expect(batches[1].id).to.equal(response.data[1].billingBatchId);
      expect(batches[1].type).to.equal(response.data[1].batchType);
      expect(batches[1].isSummer).to.equal(response.data[1].isSummer);
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
    let batch;
    let internalCallingUser;

    beforeEach(async () => {
      batch = new Batch(uuid());
      batch.fromHash({
        externalId: uuid(),
        status: Batch.BATCH_STATUS.ready
      });

      internalCallingUser = {
        email: 'test@example.com',
        id: 1234
      };
    });

    experiment('when the batch is in "sent" status', () => {
      test('an error is thrown as the batch cannot be deleted', async () => {
        batch.status = Batch.BATCH_STATUS.sent;
        const func = () => batchService.deleteBatch(batch, internalCallingUser);
        const err = await expect(func()).to.reject();
        expect(err instanceof BatchStatusError);
        expect(err.message).to.equal(`Batch ${batch.id} cannot be deleted - status is sent`);
      });
    });

    experiment('when all deletions succeed', () => {
      beforeEach(async () => {
        await batchService.deleteBatch(batch, internalCallingUser);
      });

      test('update the include in supplementary bill run status for all the licences', async () => {
        const [batchId] = licencesService.updateIncludeInSupplementaryBillingStatusForUnsentBatch.lastCall.args;
        expect(batchId).to.equal(batch.id);
      });

      test('delete the batch at the charge module', async () => {
        const [externalId] = chargeModuleBillRunConnector.delete.lastCall.args;
        expect(externalId).to.equal(batch.externalId);
      });

      test('deletes the charge version years', async () => {
        expect(newRepos.billingBatchChargeVersionYears.deleteByBatchId.calledWith(batch.id)).to.be.true();
      });

      test('deletes the billing volumes', async () => {
        expect(newRepos.billingVolumes.deleteByBatchId.calledWith(batch.id)).to.be.true();
      });

      test('deletes the transactions', async () => {
        expect(newRepos.billingTransactions.deleteByBatchId.calledWith(batch.id)).to.be.true();
      });

      test('deletes the invoice licences', async () => {
        expect(newRepos.billingInvoiceLicences.deleteByBatchId.calledWith(batch.id)).to.be.true();
      });

      test('deletes the invoices', async () => {
        expect(newRepos.billingInvoices.deleteByBatchId.calledWith(batch.id, false)).to.be.true();
      });

      test('deletes the batch', async () => {
        expect(newRepos.billingBatches.delete.calledWith(batch.id)).to.be.true();
      });

      test('creates an event showing the calling user successfully deleted the batch', async () => {
        const [savedEvent] = eventService.create.lastCall.args;
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
        chargeModuleBillRunConnector.delete.rejects(err);
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
        const [savedEvent] = eventService.create.lastCall.args;
        expect(savedEvent.issuer).to.equal(internalCallingUser.email);
        expect(savedEvent.type).to.equal('billing-batch:cancel');
        expect(savedEvent.status).to.equal('error');
        expect(savedEvent.metadata.user).to.equal(internalCallingUser);
        expect(savedEvent.metadata.batch).to.equal(batch);
      });

      test('sets the status of the batch to error', async () => {
        const [id, changes] = newRepos.billingBatches.update.lastCall.args;
        expect(id).to.equal(batch.id);
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
    let batch;
    let internalCallingUser;

    beforeEach(async () => {
      batch = {
        id: uuid(),
        externalId: uuid()
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
        const [externalId] = chargeModuleBillRunConnector.approve.lastCall.args;
        expect(externalId).to.equal(batch.externalId);
      });

      test('sends the batch at the charge module', async () => {
        const [externalId] = chargeModuleBillRunConnector.send.lastCall.args;
        expect(externalId).to.equal(batch.externalId);
      });

      test('creates an event showing the calling user successfully approved the batch', async () => {
        const [savedEvent] = eventService.create.lastCall.args;
        expect(savedEvent.issuer).to.equal(internalCallingUser.email);
        expect(savedEvent.type).to.equal('billing-batch:approve');
        expect(savedEvent.status).to.equal('sent');
        expect(savedEvent.metadata.user).to.equal(internalCallingUser);
        expect(savedEvent.metadata.batch).to.equal(batch);
      });

      test('updates the include in supplementary billing status for the batch licences', async () => {
        const [batchId] = licencesService.updateIncludeInSupplementaryBillingStatusForSentBatch.lastCall.args;
        expect(batchId).to.equal(batch.id);
      });

      test('sets the status of the batch to processing', async () => {
        const [id, changes] = newRepos.billingBatches.update.lastCall.args;
        expect(id).to.equal(batch.id);
        expect(changes).to.equal({
          status: 'processing'
        });
      });
    });

    experiment('when the batch does not approve', () => {
      let err;
      beforeEach(async () => {
        err = new Error('whoops');
        chargeModuleBillRunConnector.send.rejects(err);
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
        const [savedEvent] = eventService.create.lastCall.args;
        expect(savedEvent.issuer).to.equal(internalCallingUser.email);
        expect(savedEvent.type).to.equal('billing-batch:approve');
        expect(savedEvent.status).to.equal('error');
        expect(savedEvent.metadata.user).to.equal(internalCallingUser);
        expect(savedEvent.metadata.batch).to.equal(batch);
      });

      test('does not set the status of the batch to error so the user can retry', async () => {
        expect(newRepos.billingBatches.update.called).to.be.false();
      });
    });
  });

  experiment('.setErrorStatus', () => {
    beforeEach(async () => {
      await batchService.setErrorStatus('batch-id', 10);
    });

    test('calls billingVolumes.markVolumesAsErrored() with correct params', async () => {
      const [id, data] = newRepos.billingVolumes.markVolumesAsErrored.lastCall.args;
      expect(id).to.equal('batch-id');
      expect(data).to.equal({ require: false });
    });

    test('calls billingBatches.update() with correct params', async () => {
      const [id, data] = newRepos.billingBatches.update.lastCall.args;
      expect(id).to.equal('batch-id');
      expect(data).to.equal({ status: 'error', errorCode: 10 });
    });

    test('calls licencesService.updateIncludeInSupplementaryBillingStatusForUnsentBatch() with the batch ID', async () => {
      expect(
        licencesService.updateIncludeInSupplementaryBillingStatusForUnsentBatch.calledWith(
          'batch-id'
        )
      ).to.be.true();
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

  experiment('.getExistingOrDuplicateSentBatch', () => {
    let result;
    let regionId;

    experiment('when there is an existing batch', () => {
      beforeEach(async () => {
        regionId = '44444444-0000-0000-0000-000000000000';
        newRepos.billingBatches.findByRegionId.resolves([
          {
            billingBatchId: '11111111-0000-0000-0000-000000000000',
            batchType: 'supplementary',
            isSummer: false,
            status: 'sent'
          },
          {
            billingBatchId: '33333333-0000-0000-0000-000000000000',
            batchType: 'supplementary',
            isSummer: false,
            status: 'processing'
          }
        ]);

        result = await batchService.getExistingOrDuplicateSentBatch(regionId, 'annual', 2020, false);
      });

      test('returns the expected batch', async () => {
        expect(result.id).to.equal('33333333-0000-0000-0000-000000000000');
      });

      test('returns a service layer model', async () => {
        expect(result).to.be.instanceOf(Batch);
      });
    });

    experiment('when there is a duplicate sent batch', () => {
      beforeEach(async () => {
        regionId = '44444444-0000-0000-0000-000000000000';
        newRepos.billingBatches.findByRegionId.resolves([
          {
            billingBatchId: '11111111-0000-0000-0000-000000000000',
            batchType: 'annual',
            toFinancialYearEnding: 2020,
            isSummer: false,
            status: 'sent'
          },
          {
            billingBatchId: '33333333-0000-0000-0000-000000000000',
            batchType: 'two_part_tariff',
            toFinancialYearEnding: 2020,
            isSummer: false,
            status: 'sent'
          }
        ]);

        result = await batchService.getExistingOrDuplicateSentBatch(regionId, 'annual', 2020, false);
      });

      test('gets batches for region', async () => {
        const [id] = newRepos.billingBatches.findByRegionId.lastCall.args;
        expect(id).to.equal(regionId);
      });

      test('returns the expected batch', async () => {
        expect(result.id).to.equal('11111111-0000-0000-0000-000000000000');
      });

      test('returns a service layer model', async () => {
        expect(result).to.be.instanceOf(Batch);
      });
    });

    experiment('when there is both an existing and duplicate batch', () => {
      beforeEach(async () => {
        regionId = '44444444-0000-0000-0000-000000000000';
        newRepos.billingBatches.findByRegionId.resolves([
          {
            billingBatchId: '22222222-0000-0000-0000-000000000000',
            batchType: 'two_part_tariff',
            toFinancialYearEnding: 2020,
            isSummer: true,
            status: 'sent'
          },
          {
            billingBatchId: '33333333-0000-0000-0000-000000000000',
            batchType: 'supplementary',
            isSummer: false,
            status: 'processing'
          }
        ]);

        result = await batchService.getExistingOrDuplicateSentBatch(regionId, 'two_part_tariff', 2020, true);
      });

      test('prioritises the duplicate batch', async () => {
        expect(result.id).to.equal('22222222-0000-0000-0000-000000000000');
      });
    });

    experiment('when there are no existing or duplicate batches', () => {
      beforeEach(async () => {
        regionId = '44444444-0000-0000-0000-000000000000';
        newRepos.billingBatches.findByRegionId.resolves([]);

        result = await batchService.getExistingOrDuplicateSentBatch(regionId, 'two_part_tariff', 2020, true);
      });

      test('returns null', () => {
        expect(result).to.be.null();
      });
    });
  });

  experiment('.updateWithCMSummary', () => {
    const invoiceCount = 2;
    const creditNoteCount = 3;
    const netTotal = 1234;
    const cmResponse = {
      billRun: {
        approvedForBilling: false,
        summary: {
          invoiceCount,
          creditNoteCount,
          netTotal
        }
      }
    };

    experiment('when the CM batch is not approved for billing', async () => {
      beforeEach(async () => {
        await batchService.updateWithCMSummary(BATCH_ID, cmResponse);
      });

      test('the batch is updated correctly with "ready" status', async () => {
        expect(newRepos.billingBatches.update.calledWith(BATCH_ID, {
          status: Batch.BATCH_STATUS.ready,
          invoiceCount,
          creditNoteCount,
          netTotal
        })).to.be.true();
      });
    });

    experiment('when the CM batch is approved for billing', async () => {
      beforeEach(async () => {
        cmResponse.billRun.approvedForBilling = true;
        await batchService.updateWithCMSummary(BATCH_ID, cmResponse);
      });

      test('the batch is updated correctly with "sent" status', async () => {
        expect(newRepos.billingBatches.update.calledWith(BATCH_ID, {
          status: Batch.BATCH_STATUS.sent,
          invoiceCount,
          creditNoteCount,
          netTotal
        })).to.be.true();
      });
    });
  });

  experiment('.getTransactionStatusCounts', () => {
    let result;

    beforeEach(async () => {
      newRepos.billingTransactions.findStatusCountsByBatchId.resolves([
        {
          status: 'candidate',
          count: 3
        }, {
          status: 'charge_created',
          count: 7
        }
      ]);
      result = await batchService.getTransactionStatusCounts(BATCH_ID);
    });

    test('calls the .findStatusCountsByBatchId with correct params', async () => {
      const [id] = newRepos.billingTransactions.findStatusCountsByBatchId.lastCall.args;
      expect(id).to.equal(BATCH_ID);
    });

    test('returns the results mapped to camel-cased key/value pairs', async () => {
      expect(result).to.equal({
        candidate: 3,
        charge_created: 7
      });
    });
  });

  experiment('.setStatusToEmptyWhenNoTransactions', () => {
    experiment('when the batch has more transactions', () => {
      test('the status is not updated', async () => {
        const batch = new Batch(uuid());
        batch.status = Batch.BATCH_STATUS.ready;

        newRepos.billingTransactions.countByBatchId.resolves(5);

        const result = await batchService.setStatusToEmptyWhenNoTransactions(batch);

        expect(newRepos.billingBatches.update.called).to.equal(false);
        expect(result.id).to.equal(batch.id);
        expect(result.status).to.equal(batch.status);
      });
    });

    experiment('when the batch has no more transactions', () => {
      test('the status is updated to empty', async () => {
        const batch = new Batch(uuid());
        batch.status = Batch.BATCH_STATUS.ready;

        newRepos.billingTransactions.countByBatchId.resolves(0);

        newRepos.billingBatches.update.resolves({
          id: batch.id,
          status: Batch.BATCH_STATUS.empty
        });

        const result = await batchService.setStatusToEmptyWhenNoTransactions(batch);
        expect(result.id).to.equal(batch.id);
        expect(result.status).to.equal(Batch.BATCH_STATUS.empty);
      });
    });
  });

  experiment('.cleanup', async () => {
    beforeEach(async () => {
      await batchService.cleanup(BATCH_ID);
    });

    test('deletes licences in the batch that have no transactions', async () => {
      expect(
        newRepos.billingInvoiceLicences.deleteEmptyByBatchId.calledWith(BATCH_ID)
      ).to.be.true();
    });

    test('deletes invoices in the batch that have no licences', async () => {
      expect(
        newRepos.billingInvoices.deleteEmptyByBatchId.calledWith(BATCH_ID)
      ).to.be.true();
    });
  });

  experiment('.create', async () => {
    experiment('when there is an existing batch', async () => {
      const existingBatchId = uuid();
      const regionId = uuid();

      beforeEach(async () => {
        newRepos.billingBatches.findByRegionId.resolves([{
          billingBatchId: existingBatchId,
          batchType: 'supplementary',
          isSummer: false,
          status: 'processing'
        }]);
      });

      test('the function rejects', async () => {
        const func = () => batchService.create(regionId, 'supplementary', 2019, false);
        expect(func()).to.reject();
      });

      test('a Boom Conflict error is thrown with expected message and batch', async () => {
        try {
          await batchService.create(regionId, 'supplementary', 2019, false);
          fail();
        } catch (err) {
          expect(err.isBoom).to.be.true();
          expect(err.output.statusCode).to.equal(409);
          expect(err.message).to.equal(`Batch already live for region ${regionId}`);
          expect(err.output.payload.batch.id).to.equal(existingBatchId);
        }
      });
    });

    experiment('when there is a duplicate sent batch', async () => {
      const existingBatchId = uuid();
      const regionId = uuid();

      beforeEach(async () => {
        newRepos.billingBatches.findByRegionId.resolves([{
          billingBatchId: existingBatchId,
          batchType: 'annual',
          toFinancialYearEnding: 2019,
          isSummer: false,
          status: 'sent'
        }]);
      });

      test('the function rejects', async () => {
        const func = () => batchService.create(regionId, 'annual', 2019, false);
        expect(func()).to.reject();
      });

      test('a Boom Conflict error is thrown with expected message and batch', async () => {
        try {
          await batchService.create(regionId, 'annual', 2019, false);
          fail();
        } catch (err) {
          expect(err.isBoom).to.be.true();
          expect(err.output.statusCode).to.equal(409);
          expect(err.message).to.equal(`Annual batch already sent for: region ${regionId}, financial year 2019, isSummer false`);
          expect(err.output.payload.batch.id).to.equal(existingBatchId);
        }
      });
    });

    experiment('when there is not an existing batch', async () => {
      let result;
      const regionId = uuid();

      beforeEach(async () => {
        newRepos.billingBatches.findByRegionId.resolves([]);
        newRepos.billingBatches.create.resolves({
          billingBatchId: uuid()
        });
        sandbox.stub(config.billing, 'supplementaryYears').value(6);
      });

      experiment('and the batch type is annual', async () => {
        beforeEach(async () => {
          result = await batchService.create(regionId, 'annual', 2019, 'all-year');
        });

        test('a batch is created processing 1 financial year', async () => {
          expect(newRepos.billingBatches.create.calledWith({
            status: 'processing',
            regionId,
            batchType: 'annual',
            fromFinancialYearEnding: 2019,
            toFinancialYearEnding: 2019,
            isSummer: false
          }));
        });

        test('the result is a batch', async () => {
          expect(result instanceof Batch).to.be.true();
        });
      });

      experiment('and the batch type is supplementary', async () => {
        beforeEach(async () => {
          result = await batchService.create(regionId, 'supplementary', 2019, 'all-year');
        });

        test('a batch is created processing the number of years specified in config.billing.supplementaryYears', async () => {
          expect(newRepos.billingBatches.create.calledWith({
            status: 'processing',
            regionId,
            batchType: 'supplementary',
            fromFinancialYearEnding: 2013,
            toFinancialYearEnding: 2019,
            isSummer: false
          }));
        });

        test('the result is a batch', async () => {
          expect(result instanceof Batch).to.be.true();
        });
      });

      experiment('and the batch type is two_part_tariff', async () => {
        beforeEach(async () => {
          result = await batchService.create(regionId, 'two_part_tariff', 2019, 'summer');
        });

        test('a batch is created processing 1 financial year', async () => {
          expect(newRepos.billingBatches.create.calledWith({
            status: 'processing',
            regionId,
            batchType: 'two_part_tariff',
            fromFinancialYearEnding: 2019,
            toFinancialYearEnding: 2019,
            isSummer: true
          }));
        });

        test('the result is a batch', async () => {
          expect(result instanceof Batch).to.be.true();
        });
      });
    });
  });

  experiment('.createChargeModuleBillRun', async () => {
    let result;
    const cmResponse = {
      billRun: {
        id: uuid(),
        billRunNumber: 1234
      }
    };

    beforeEach(async () => {
      chargeModuleBillRunConnector.create.resolves(cmResponse);
      newRepos.billingBatches.update.resolves({
        externalId: cmResponse.billRun.id,
        billRunNumber: cmResponse.billRun.billRunNumber
      });
      result = await batchService.createChargeModuleBillRun(BATCH_ID);
    });

    test('the correct batch is loaded from the DB', async () => {
      expect(newRepos.billingBatches.findOne.calledWith(BATCH_ID)).to.be.true();
    });

    test('a batch is created in the charge module with the correct region', async () => {
      expect(chargeModuleBillRunConnector.create.calledWith(REGION_ID));
    });

    test('the batch is updated with the values from the CM', async () => {
      expect(newRepos.billingBatches.update.calledWith(
        BATCH_ID, {
          externalId: cmResponse.billRun.id,
          billRunNumber: cmResponse.billRun.billRunNumber
        }
      ));
    });

    test('the updated batch is returned', async () => {
      expect(result instanceof Batch).to.be.true();
      expect(result.id).to.equal(BATCH_ID);
      expect(result.externalId).to.equal(cmResponse.billRun.id);
      expect(result.billRunNumber).to.equal(cmResponse.billRun.billRunNumber);
    });
  });

  experiment('.approveTptBatchReview', async () => {
    let result, batch;

    beforeEach(async () => {
      batch = createBatch({
        id: BATCH_ID,
        type: Batch.BATCH_TYPE.twoPartTariff,
        status: Batch.BATCH_STATUS.review
      });
    });

    experiment('when the batch is validated', () => {
      beforeEach(async () => {
        result = await batchService.approveTptBatchReview(batch);
      });

      test('updated the batch status to "processing"', async () => {
        expect(
          newRepos.billingBatches.update.calledWith(
            batch.id,
            { status: Batch.BATCH_STATUS.processing })
        ).to.be.true();
      });

      test('the updated batch is returned', async () => {
        expect(result).to.be.an.instanceOf(Batch);
        expect(result.id).to.equal(BATCH_ID);
        expect(result.status).to.equal(Batch.BATCH_STATUS.processing);
      });
    });

    experiment('the batch is not validated when ', () => {
      test('it has the wrong status', async () => {
        batch.status = Batch.BATCH_STATUS.ready;
        try {
          await batchService.approveTptBatchReview(batch);
        } catch (err) {
          expect(err).to.be.an.instanceOf(BatchStatusError);
          expect(err.message).to.equal('Cannot approve review. Batch status must be "review"');
        }
      });

      test('there are outstanding twoPartTariffErrors to resolve', async () => {
        billingVolumesService.approveVolumesForBatch.rejects();
        expect(batchService.approveTptBatchReview(batch)).to.reject();
      });
    });
  });

  experiment('.deleteBatchInvoice', () => {
    let batch, invoiceId;

    experiment('when the batch is not in "ready" status', () => {
      beforeEach(async () => {
        batch = new Batch();
        batch.status = Batch.BATCH_STATUS.review;
      });

      test('throws a BatchStatusError', async () => {
        const func = () => batchService.deleteBatchInvoice(batch, invoiceId);
        const err = await expect(func()).to.reject();
        expect(err instanceof BatchStatusError).to.be.true();
      });
    });

    experiment('when the batch is in "ready" status', () => {
      beforeEach(async () => {
        batch = new Batch(uuid());
        batch.fromHash({
          status: Batch.BATCH_STATUS.ready,
          externalId: uuid()
        });
      });

      test('throws a NotFoundError if the invoice is not found', async () => {
        newRepos.billingInvoices.findOne.resolves(null);
        const func = () => batchService.deleteBatchInvoice(batch, invoiceId);
        const err = await expect(func()).to.reject();
        expect(err instanceof NotFoundError).to.be.true();
      });

      experiment('when the invoice is found and there are no errors', () => {
        let billingInvoiceId, invoiceAccountId, licenceId;

        beforeEach(async () => {
          billingInvoiceId = uuid();
          invoiceAccountId = uuid();
          licenceId = uuid();

          newRepos.billingInvoices.findOne.resolves({
            billingInvoiceId,
            invoiceAccountId,
            invoiceAccountNumber: 'A12345678A',
            financialYearEnding: 2020,
            billingBatch: {
              externalId: batch.externalId
            },
            billingInvoiceLicences: [
              {
                billingInvoiceId,
                billingInvoiceLicenceId: uuid(),
                licenceId,
                licence: {
                  licenceRef: '123/321',
                  licenceId,
                  region: {
                    regionId: uuid(),
                    name: 'test',
                    chargeRegionId: 'T',
                    displayName: 'test'
                  },
                  regions: {
                    historicalAreaCode: 'ABCD',
                    regionalChargeArea: 'The Moon'
                  },
                  startDate: '2000-01-01',
                  expiredDate: null,
                  lapsedDate: null,
                  revokedDate: null
                }
              }
            ]
          });
          newRepos.billingTransactions.countByBatchId.resolves(0);
          await batchService.deleteBatchInvoice(batch, invoiceId);
        });

        test('loads the invoice with the supplied ID', async () => {
          expect(newRepos.billingInvoices.findOne.calledWith(invoiceId)).to.be.true();
        });

        test('deletes the charge module transactions in the bill run with matching customer number and financial year', async () => {
          expect(chargeModuleBillRunConnector.removeCustomerInFinancialYear.calledWith(
            batch.externalId, 'A12345678A', 2020
          )).to.be.true();
        });

        test('deletes associated charge version years from batch', async () => {
          expect(newRepos.billingBatchChargeVersionYears.deleteByInvoiceId.calledWith(invoiceId)).to.be.true();
        });

        test('deletes associated billing volumes from batch', async () => {
          expect(newRepos.billingVolumes.deleteByBatchAndInvoiceId.calledWith(batch.id, invoiceId)).to.be.true();
        });

        test('deletes associated transactions from batch', async () => {
          expect(newRepos.billingTransactions.deleteByInvoiceId.calledWith(invoiceId)).to.be.true();
        });

        test('deletes associated invoice licences from batch', async () => {
          expect(newRepos.billingInvoiceLicences.deleteByInvoiceId.calledWith(invoiceId)).to.be.true();
        });

        test('deletes invoice from batch', async () => {
          expect(newRepos.billingInvoices.delete.calledWith(invoiceId)).to.be.true();
        });

        test('updates the include in supplementary billing status to reprocess where currently yes', async () => {
          const [from, to, licenceId] = licencesService.updateIncludeInSupplementaryBillingStatus.lastCall.args;
          expect(from).to.equal('yes');
          expect(to).to.equal('reprocess');
          expect(licenceId).to.equal(licenceId);
        });

        test('sets status of batch to empty when there are no transactions', () => {
          expect(newRepos.billingBatches.update.calledWith(
            batch.id, { status: 'empty' }
          )).to.be.true();
        });
      });

      experiment('when the invoice is found and there is an error errors', () => {
        beforeEach(async () => {
          newRepos.billingInvoices.findOne.resolves({
            invoiceAccountNumber: 'A12345678A',
            financialYearEnding: 2020,
            billingBatch: {
              externalId: batch.externalId
            }
          });
          newRepos.billingTransactions.findByBatchId.resolves([]);
          chargeModuleBillRunConnector.removeCustomerInFinancialYear.rejects(new Error('oh no!'));
        });

        test('the batch is set to error status with the correct code', async () => {
          const func = () => batchService.deleteBatchInvoice(batch, invoiceId);
          await expect(func()).to.reject();
          expect(newRepos.billingBatches.update.calledWith(
            batch.id, { status: Batch.BATCH_STATUS.error, errorCode: Batch.BATCH_ERROR_CODE.failedToDeleteInvoice }
          )).to.be.true();
        });

        test('the error is rethrown', async () => {
          const func = () => batchService.deleteBatchInvoice(batch, invoiceId);
          const err = await expect(func()).to.reject();
          expect(err.message).to.equal('oh no!');
        });
      });
    });
  });

  experiment('.deleteAllBillingData', () => {
    beforeEach(async () => {
      newRepos.billingBatches.find.resolves([{
        externalId: null
      }, {
        externalId: 'test-external-id-1'
      }, {
        externalId: 'test-external-id-2'
      }]);
    });

    experiment('when there are no errors', () => {
      beforeEach(async () => {
        await batchService.deleteAllBillingData();
      });

      test('no error messages are logged', async () => {
        expect(logger.error.called).to.be.false();
      });

      test('info messages are logged', async () => {
        expect(logger.info.callCount).to.equal(2);
        expect(logger.info.calledWith(
          'Deleting Charge Module batch test-external-id-1'
        )).to.be.true();
        expect(logger.info.calledWith(
          'Deleting Charge Module batch test-external-id-2'
        )).to.be.true();
      });

      test('each charge module batch is deleted', async () => {
        expect(chargeModuleBillRunConnector.delete.callCount).to.equal(2);
        expect(chargeModuleBillRunConnector.delete.calledWith(
          'test-external-id-1'
        )).to.be.true();
        expect(chargeModuleBillRunConnector.delete.calledWith(
          'test-external-id-2'
        )).to.be.true();
      });

      test('the billing / charge version data is deleted from water service tables', async () => {
        expect(newRepos.billingBatches.deleteAllBillingData.called).to.be.true();
      });
    });

    experiment('when there is a charge module API error', () => {
      const err = new Error('oops!');

      beforeEach(async () => {
        chargeModuleBillRunConnector.delete.onCall(1).rejects(err);
        await batchService.deleteAllBillingData();
      });

      test('info messages are logged', async () => {
        expect(logger.info.callCount).to.equal(2);
        expect(logger.info.calledWith(
          'Deleting Charge Module batch test-external-id-1'
        )).to.be.true();
        expect(logger.info.calledWith(
          'Deleting Charge Module batch test-external-id-2'
        )).to.be.true();
      });

      test('an error is logged for the failed call', async () => {
        expect(logger.error.callCount).to.equal(1);
        expect(logger.error.calledWith(
          'Unable to delete Charge Module batch test-external-id-2', err
        )).to.be.true();
      });

      test('each charge module batch is deleted', async () => {
        expect(chargeModuleBillRunConnector.delete.callCount).to.equal(2);
        expect(chargeModuleBillRunConnector.delete.calledWith(
          'test-external-id-1'
        )).to.be.true();
        expect(chargeModuleBillRunConnector.delete.calledWith(
          'test-external-id-2'
        )).to.be.true();
      });

      test('the billing / charge version data is deleted from water service tables', async () => {
        expect(newRepos.billingBatches.deleteAllBillingData.called).to.be.true();
      });
    });
  });
});
