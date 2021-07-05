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

const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');

const newRepos = require('../../../../src/lib/connectors/repos');
const mappers = require('../../../../src/modules/billing/mappers'); ;

experiment('modules/billing/services/invoice-licences-service', () => {
  beforeEach(async () => {
    sandbox.stub(newRepos.billingInvoiceLicences, 'findOne');
    sandbox.stub(newRepos.billingInvoiceLicences, 'upsert');
    sandbox.stub(newRepos.billingInvoiceLicences, 'findOneInvoiceLicenceWithTransactions');
    sandbox.stub(newRepos.billingInvoiceLicences, 'delete');

    sandbox.stub(newRepos.billingVolumes, 'deleteByInvoiceLicenceAndBatchId');

    sandbox.stub(newRepos.billingTransactions, 'deleteByInvoiceLicenceId');

    sandbox.stub(mappers.invoiceLicence, 'modelToDB').returns({
      licenceRef: '01/123'
    });

    sandbox.stub(newRepos.licences, 'updateIncludeLicenceInSupplementaryBilling');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.saveInvoiceLicenceToDB', () => {
    const invoice = new Invoice('40283a80-766f-481f-ba54-484ac0b7ea6d');
    const invoiceLicence = new InvoiceLicence('399282c3-f9b4-4a4b-af1b-0019e040ad61');
    let result;

    beforeEach(async () => {
      newRepos.billingInvoiceLicences.upsert.resolves({
        billingInvoiceLicenceId: uuid(),
        licenceId: uuid(),
        licenceRef: '01/123',
        billingInvoiceId: uuid()
      });
      result = await invoiceLicencesService.saveInvoiceLicenceToDB(invoice, invoiceLicence);
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

    test('resolves with an InvoiceLicence instance', () => {
      expect(result).to.be.an.instanceOf(InvoiceLicence);
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
});
