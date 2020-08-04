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

const invoiceLicencesService = require('../../../../src/modules/billing/services/invoice-licences-service');
const batchService = require('../../../../src/modules/billing/services/batch-service');

const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');

const newRepos = require('../../../../src/lib/connectors/repos');
const mappers = require('../../../../src/modules/billing/mappers'); ;

const { NotFoundError } = require('../../../../src/lib/errors');
const { BatchStatusError } = require('../../../../src/modules/billing/lib/errors');

experiment('modules/billing/services/invoice-licences-service', () => {
  beforeEach(async () => {
    sandbox.stub(newRepos.billingInvoiceLicences, 'findOne');
    // sandbox.stub(newRepos.billingInvoiceLicences, 'findLicencesWithTransactionStatusesForBatch');
    sandbox.stub(newRepos.billingInvoiceLicences, 'upsert');
    sandbox.stub(newRepos.billingInvoiceLicences, 'findOneInvoiceLicenceWithTransactions');
    sandbox.stub(newRepos.billingInvoiceLicences, 'delete');

    sandbox.stub(newRepos.billingVolumes, 'deleteByInvoiceLicenceAndBatchId');

    sandbox.stub(newRepos.billingTransactions, 'deleteByInvoiceLicenceId');

    sandbox.stub(mappers.invoiceLicence, 'modelToDB').returns({
      licenceRef: '01/123'
    });

    sandbox.stub(newRepos.licences, 'updateIncludeLicenceInSupplementaryBilling');

    sandbox.stub(batchService, 'setStatusToEmptyWhenNoTransactions').resolves();
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

  experiment('.deleteInvoiceLicence', () => {
    let result;
    const invoiceLicenceId = uuid();
    const billingBatchId = uuid();

    experiment('when the invoice licence is not found', () => {
      beforeEach(async () => {
        newRepos.billingInvoiceLicences.findOne.resolves(null);
        const func = () => invoiceLicencesService.delete(invoiceLicenceId);
        result = await expect(func()).to.reject();
      });

      test('the repo method is called with the correct invoiceLicenceId', async () => {
        expect(
          newRepos.billingInvoiceLicences.findOne.calledWith(invoiceLicenceId)
        ).to.be.true();
      });

      test('rejects with a NotFoundError', async () => {
        expect(result instanceof NotFoundError).to.be.true();
      });
    });

    experiment('when the invoice licence is found, and the batch status is not "review"', () => {
      beforeEach(async () => {
        newRepos.billingInvoiceLicences.findOne.resolves({
          billingInvoice: {
            billingBatch: {
              billingBatchId,
              status: 'ready',
              batchType: 'supplementary'
            }
          }
        });
        const func = () => invoiceLicencesService.delete(invoiceLicenceId);
        result = await expect(func()).to.reject();
      });

      test('rejects with a BatchStatusError', async () => {
        expect(result instanceof BatchStatusError).to.be.true();
      });
    });

    experiment('when the invoice licence is found, and the batch status is "review"', () => {
      let licenceId;

      beforeEach(async () => {
        newRepos.billingInvoiceLicences.findOne.resolves({
          licenceId: licenceId = uuid(),
          billingInvoice: {
            billingBatch: {
              billingBatchId,
              status: 'review',
              batchType: 'supplementary'
            }
          }
        });
        result = await invoiceLicencesService.delete(invoiceLicenceId);
      });

      test('related billing volumes are deleted', async () => {
        expect(
          newRepos.billingVolumes.deleteByInvoiceLicenceAndBatchId.calledWith(invoiceLicenceId, billingBatchId)
        ).to.be.true();
      });

      test('related transactions are deleted', async () => {
        expect(
          newRepos.billingTransactions.deleteByInvoiceLicenceId.calledWith(invoiceLicenceId)
        ).to.be.true();
      });

      test('the invoice licence is deleted', async () => {
        expect(
          newRepos.billingInvoiceLicences.delete.calledWith(invoiceLicenceId)
        ).to.be.true();
      });

      test('the batch status is set to empty if no transactions remain', async () => {
        const [batch] = batchService.setStatusToEmptyWhenNoTransactions.lastCall.args;
        expect(batch.id).to.equal(billingBatchId);
      });

      test('the licence includeInSupplementary billing status is updated', async () => {
        const [id, statusFrom, statusTo] = newRepos.licences.updateIncludeLicenceInSupplementaryBilling.lastCall.args;
        expect(id).to.equal(licenceId);
        expect(statusFrom).to.equal('yes');
        expect(statusTo).to.equal('reprocess');
      });
    });
  });
});
