const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();
const uuid = require('uuid/v4');

const { set, cloneDeep } = require('lodash');
const invoiceLicencesService = require('../../../../src/modules/billing/services/invoice-licences-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');
const licencesService = require('../../../../src/lib/services/licences');

const messageQueue = require('../../../../src/lib/message-queue-v2');
const chargeModuleBillRunConnector = require('../../../../src/lib/connectors/charge-module/bill-runs');

const Batch = require('../../../../src/lib/models/batch');
const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');

const newRepos = require('../../../../src/lib/connectors/repos');
const mappers = require('../../../../src/modules/billing/mappers');

const errors = require('../../../../src/lib/errors');

experiment('modules/billing/services/invoice-licences-service', () => {
  let messageQueueStub;

  beforeEach(async () => {
    sandbox.stub(newRepos.billingInvoiceLicences, 'findOne');
    sandbox.stub(newRepos.billingInvoiceLicences, 'upsert');
    sandbox.stub(newRepos.billingInvoiceLicences, 'findOneInvoiceLicenceWithTransactions');
    sandbox.stub(newRepos.billingInvoiceLicences, 'delete');
    sandbox.stub(newRepos.billingInvoiceLicences, 'findCountByInvoiceId');

    sandbox.stub(newRepos.billingVolumes, 'deleteByInvoiceLicenceAndBatchId');

    sandbox.stub(newRepos.billingTransactions, 'deleteByInvoiceLicenceId');

    sandbox.stub(mappers.invoiceLicence, 'modelToDB').returns({
      licenceRef: '01/123'
    });

    sandbox.stub(newRepos.licences, 'updateIncludeLicenceInSupplementaryBilling');

    messageQueueStub = {
      add: sandbox.stub()
    };
    sandbox.stub(messageQueue, 'getQueueManager').returns(messageQueueStub);

    sandbox.stub(batchService, 'setStatus');

    sandbox.stub(chargeModuleBillRunConnector, 'getInvoiceTransactions');
    sandbox.stub(chargeModuleBillRunConnector, 'deleteLicence');

    sandbox.stub(licencesService, 'flagForSupplementaryBilling');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.saveInvoiceLicenceToDB', () => {
    const invoice = new Invoice('40283a80-766f-481f-ba54-484ac0b7ea6d');
    const invoiceLicence = new InvoiceLicence('399282c3-f9b4-4a4b-af1b-0019e040ad61');

    beforeEach(async () => {
      await invoiceLicencesService.saveInvoiceLicenceToDB(invoice, invoiceLicence);
    });

    test('passes the models to the correct mapper', async () => {
      const { args } = mappers.invoiceLicence.modelToDB.lastCall;
      expect(args).to.equal([invoice, invoiceLicence]);
    });

    test('passes the result of the mapping to the repo for upsert', async () => {
      const [data] = newRepos.billingInvoiceLicences.upsert.lastCall.args;
      expect(data).to.equal({
        licenceRef: '01/123'
      });
    });
  });

  experiment('.getInvoiceLicenceWithTransactions', () => {
    experiment('when there is data returned it contains', () => {
      beforeEach(async () => {
        newRepos.billingInvoiceLicences.findOneInvoiceLicenceWithTransactions.resolves(
          {
            billingInvoiceLicenceId: 'db-invoice-licence-id'
          }
        );
        sandbox.stub(mappers.invoiceLicence, 'dbToModel').returns({
          billingInvoiceLicenceId: 'mapper-invoice-licence-id'
        });
        await invoiceLicencesService.getInvoiceLicenceWithTransactions('invoice-licence-id');
      });

      test('calls the billing licence invoice repo with the correct id', async () => {
        expect(newRepos.billingInvoiceLicences.findOneInvoiceLicenceWithTransactions.lastCall.args[0]).to.equal('invoice-licence-id');
      });

      test('calls the invoice mapper to map the data from database to the correct models', async () => {
        expect(mappers.invoiceLicence.dbToModel.lastCall.args[0]).to.equal({ billingInvoiceLicenceId: 'db-invoice-licence-id' });
      });
    });
  });

  experiment('.getOrCreateInvoiceLicence', () => {
    let result;
    const billingInvoiceId = uuid();
    const licenceId = uuid();
    const licenceRef = '01/123/ABC';
    const billingInvoiceLicenceId = uuid();

    beforeEach(async () => {
      newRepos.billingInvoiceLicences.upsert.resolves({
        billingInvoiceLicenceId,
        billingInvoiceId,
        licenceId,
        licenceRef
      });
      result = await invoiceLicencesService.getOrCreateInvoiceLicence(billingInvoiceId, licenceId, licenceRef);
    });

    test('the record is upserted', async () => {
      expect(newRepos.billingInvoiceLicences.upsert.calledWith({
        billingInvoiceId,
        licenceId,
        licenceRef
      })).to.be.true();
    });

    test('resolves with an InvoiceLicence model', async () => {
      expect(result instanceof InvoiceLicence).to.be.true();
      expect(result.id).to.equal(billingInvoiceLicenceId);
    });
  });

  experiment('.deleteByInvoiceLicenceId', () => {
    // WRLS data
    const batchId = 'test-batch-id';
    const invoiceLicenceId = 'test-invoice-licence-id';
    const licenceNumber = '01/123/ABC';
    const licenceId = 'test-licence-id';

    // CM data
    const cmLicenceId = 'cm-test-licence-id';
    const cmBatchId = 'cm-test-batch-id';
    const cmInvoiceId = 'cm-test-invoice-id';

    const billingInvoiceLicence = {
      billingInvoiceLicenceId: invoiceLicenceId,
      licenceRef: licenceNumber,
      licenceId,
      billingInvoice: {
        billingBatch: {
          billingBatchId: batchId,
          status: Batch.BATCH_STATUS.ready,
          externalId: cmBatchId
        },
        rebillingState: null,
        externalId: cmInvoiceId
      }
    };

    const cmResponse = {
      invoice: {
        licences: [{
          id: cmLicenceId,
          licenceNumber
        }]
      }
    };

    experiment('when the invoice licence can be deleted', () => {
      beforeEach(async () => {
        newRepos.billingInvoiceLicences.findOne.resolves(billingInvoiceLicence);
        newRepos.billingInvoiceLicences.findCountByInvoiceId.resolves(2);
        chargeModuleBillRunConnector.getInvoiceTransactions.resolves(cmResponse);
        await invoiceLicencesService.deleteByInvoiceLicenceId(invoiceLicenceId);
      });

      test('the billing invoice licence is fetched from the DB', async () => {
        expect(newRepos.billingInvoiceLicences.findOne.calledWith(
          invoiceLicenceId
        )).to.be.true();
      });

      test('the batch is set to "processing" status', async () => {
        const [id, status] = batchService.setStatus.firstCall.args;
        expect(id).to.equal(batchId);
        expect(status).to.equal(Batch.BATCH_STATUS.processing);
      });

      test('the invoice is fetched from the CM', async () => {
        expect(chargeModuleBillRunConnector.getInvoiceTransactions.calledWith(
          cmBatchId, cmInvoiceId
        )).to.be.true();
      });

      test('the licence is deleted in the CM', async () => {
        expect(chargeModuleBillRunConnector.deleteLicence.callCount).to.equal(1);
        expect(chargeModuleBillRunConnector.deleteLicence.calledWith(
          cmBatchId, cmLicenceId
        )).to.be.true();
      });

      test('the invoice licence transactions are deleted from the DB', async () => {
        expect(newRepos.billingTransactions.deleteByInvoiceLicenceId.callCount).to.equal(1);
        expect(newRepos.billingTransactions.deleteByInvoiceLicenceId.calledWith(
          invoiceLicenceId
        )).to.be.true();
      });

      test('the invoice licence is deleted from the DB', async () => {
        expect(newRepos.billingInvoiceLicences.delete.callCount).to.equal(1);
        expect(newRepos.billingInvoiceLicences.delete.calledWith(
          invoiceLicenceId
        )).to.be.true();
      });

      test('the licence is flagged for supplementary billing', async () => {
        expect(licencesService.flagForSupplementaryBilling.calledWith(
          licenceId
        )).to.be.true();
      });

      test('a job is published to the message queue to refresh the batch', async () => {
        expect(messageQueueStub.add.calledWith(
          'billing.refresh-totals', batchId
        )).to.be.true();
      });
    });

    experiment('when the invoice licence is not found', () => {
      beforeEach(async () => {
        newRepos.billingInvoiceLicences.findOne.resolves(null);
        newRepos.billingInvoiceLicences.findCountByInvoiceId.resolves(2);
        chargeModuleBillRunConnector.getInvoiceTransactions.resolves(cmResponse);
      });

      test('rejects with a NotFound error', async () => {
        const func = () => invoiceLicencesService.deleteByInvoiceLicenceId(invoiceLicenceId);
        const err = await expect(func()).to.reject();
        expect(err).to.be.an.instanceOf(errors.NotFoundError);
      });
    });

    experiment('when the batch is not ready', () => {
      beforeEach(async () => {
        const billingInvoiceLicenceUnreadyBatch = set(
          cloneDeep(billingInvoiceLicence),
          'billingInvoice.billingBatch.status',
          Batch.BATCH_STATUS.processing
        );
        newRepos.billingInvoiceLicences.findOne.resolves(billingInvoiceLicenceUnreadyBatch);
        newRepos.billingInvoiceLicences.findCountByInvoiceId.resolves(2);
        chargeModuleBillRunConnector.getInvoiceTransactions.resolves(cmResponse);
      });

      test('rejects with a ConflictingDataError error', async () => {
        const func = () => invoiceLicencesService.deleteByInvoiceLicenceId(invoiceLicenceId);
        const err = await expect(func()).to.reject();
        expect(err).to.be.an.instanceOf(errors.ConflictingDataError);
      });
    });

    experiment('when the invoice is a rebilling invoice', () => {
      beforeEach(async () => {
        const billingInvoiceLicenceRebilling = set(
          cloneDeep(billingInvoiceLicence),
          'billingInvoice.rebillingState',
          'rebilling'
        );
        newRepos.billingInvoiceLicences.findOne.resolves(billingInvoiceLicenceRebilling);
        newRepos.billingInvoiceLicences.findCountByInvoiceId.resolves(2);
        chargeModuleBillRunConnector.getInvoiceTransactions.resolves(cmResponse);
      });

      test('rejects with a ConflictingDataError error', async () => {
        const func = () => invoiceLicencesService.deleteByInvoiceLicenceId(invoiceLicenceId);
        const err = await expect(func()).to.reject();
        expect(err).to.be.an.instanceOf(errors.ConflictingDataError);
      });
    });

    experiment('when the invoice only has 1 licence', () => {
      beforeEach(async () => {
        newRepos.billingInvoiceLicences.findOne.resolves(billingInvoiceLicence);
        newRepos.billingInvoiceLicences.findCountByInvoiceId.resolves(1);
        chargeModuleBillRunConnector.getInvoiceTransactions.resolves(cmResponse);
      });

      test('rejects with a ConflictingDataError error', async () => {
        const func = () => invoiceLicencesService.deleteByInvoiceLicenceId(invoiceLicenceId);
        const err = await expect(func()).to.reject();
        expect(err).to.be.an.instanceOf(errors.ConflictingDataError);
      });
    });
  });
});
