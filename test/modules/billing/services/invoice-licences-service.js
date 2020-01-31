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
const licenceService = require('../../../../src/modules/billing/services/licence-service');

const InvoiceLicence = require('../../../../src/lib/models/invoice-licence');
const Licence = require('../../../../src/lib/models/licence');

const repos = require('../../../../src/lib/connectors/repository');

experiment('modules/billing/services/invoice-licences-service', () => {
  beforeEach(async () => {
    sandbox.stub(repos.billingInvoiceLicences, 'findOneByTransactionId');
    sandbox.stub(licenceService, 'getByLicenceNumber');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getByTransactionId', () => {
    let result;

    const dbRow = {
      billingInvoiceLicenceId: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
      companyId: '40283a80-766f-481f-ba54-484ac0b7ea6d',
      addressId: '399282c3-f9b4-4a4b-af1b-0019e040ad61'
    };

    const licence = new Licence();

    beforeEach(async () => {
      repos.billingInvoiceLicences.findOneByTransactionId.resolves(dbRow);
      licenceService.getByLicenceNumber.resolves(licence);
      result = await invoiceLicencesService.getByTransactionId('transaction-id');
    });

    test('calls .findOneByTransactionId with correct ID', async () => {
      const [id] = repos.billingInvoiceLicences.findOneByTransactionId.lastCall.args;
      expect(id).to.equal('transaction-id');
    });

    test('resolves with an InvoiceLicence model', async () => {
      expect(result instanceof InvoiceLicence).to.be.true();
    });

    test('the invoice licence has a licence property', async () => {
      expect(result.licence).to.equal(licence);
    });
  });
});
