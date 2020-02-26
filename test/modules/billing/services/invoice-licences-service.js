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
    sandbox.stub(newRepos.billingInvoiceLicences, 'upsert');
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
});
