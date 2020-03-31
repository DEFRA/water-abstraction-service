const {
  experiment,
  test,
  beforeEach,
  afterEach
} = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const sinon = require('sinon');
const sandbox = sinon.createSandbox();

const invoiceLicencesService = require('../../../../src/modules/billing/services/invoice-licences-service');

const Invoice = require('../../../../src/lib/models/invoice');
const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');

const newRepos = require('../../../../src/lib/connectors/repos');
const mappers = require('../../../../src/modules/billing/mappers');

experiment('modules/billing/services/invoice-licences-service', () => {
  beforeEach(async () => {
    sandbox.stub(newRepos.billingInvoiceLicences, 'findLicencesWithTransactionStatusesForBatch');
    sandbox.stub(newRepos.billingInvoiceLicences, 'upsert');
    sandbox.stub(newRepos.billingInvoiceLicences, 'findOneInvoiceLicenceWithTransactions');
    sandbox.stub(mappers.invoiceLicence, 'modelToDB').returns({
      licenceRef: '01/123'
    });
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

  experiment('.getLicencesWithTransactionStatusesForBatch', () => {
    experiment('when there is data returned it contains', () => {
      let result;

      beforeEach(async () => {
        newRepos.billingInvoiceLicences.findLicencesWithTransactionStatusesForBatch.resolves([
          {
            billingInvoiceId: 'billing-invoice-id-1',
            billingInvoiceLicenceId: 'billing-invoice-licence-id-1',
            licenceRef: 'licence-1',
            licenceId: 'licence-id-1',
            licenceHolderName: {
              id: 'licence-holder-1',
              name: 'licence-holder-1-name'
            },
            twoPartTariffStatuses: [
              null,
              null
            ]
          },
          {
            billingInvoiceId: 'billing-invoice-id-2',
            billingInvoiceLicenceId: 'billing-invoice-licence-id-2',
            licenceRef: 'licence-2',
            licenceId: 'licence-id-2',
            licenceHolderName: {
              id: 'licence-holder-2',
              initials: 'A B',
              lastName: 'Last',
              firstName: 'First',
              salutation: null
            },
            twoPartTariffStatuses: [
              100,
              null,
              200,
              200
            ]
          }
        ]);

        result = await invoiceLicencesService.getLicencesWithTransactionStatusesForBatch('batch-id');
      });

      test('the billing invoice id', async () => {
        expect(result[0].billingInvoiceId).to.equal('billing-invoice-id-1');
        expect(result[1].billingInvoiceId).to.equal('billing-invoice-id-2');
      });

      test('the billing invoice licence id', async () => {
        expect(result[0].billingInvoiceLicenceId).to.equal('billing-invoice-licence-id-1');
        expect(result[1].billingInvoiceLicenceId).to.equal('billing-invoice-licence-id-2');
      });

      test('the licence ref', async () => {
        expect(result[0].licenceRef).to.equal('licence-1');
        expect(result[1].licenceRef).to.equal('licence-2');
      });

      test('the licence id', async () => {
        expect(result[0].licenceId).to.equal('licence-id-1');
        expect(result[1].licenceId).to.equal('licence-id-2');
      });

      test('the licence holder object', async () => {
        expect(result[0].licenceHolder).to.equal({
          id: 'licence-holder-1',
          name: 'licence-holder-1-name'
        });

        expect(result[1].licenceHolder).to.equal({
          id: 'licence-holder-2',
          initials: 'A B',
          lastName: 'Last',
          firstName: 'First',
          salutation: null
        });
      });

      test('an empty array status codes when the values are all null', async () => {
        expect(result[0].twoPartTariffStatuses).to.equal([]);
      });

      test('an array of unique status codes when the values are not all null', async () => {
        expect(result[1].twoPartTariffStatuses).to.equal([100, 200]);
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
});
