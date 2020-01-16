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
const Address = require('../../../../src/lib/models/address');
const Company = require('../../../../src/lib/models/company');
const Contact = require('../../../../src/lib/models/contact-v2');
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

  experiment('.mapDBToModel', () => {
    let result;
    experiment('when there is no contact ID', () => {
      const dbRow = {
        billing_invoice_licence_id: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
        company_id: '40283a80-766f-481f-ba54-484ac0b7ea6d',
        address_id: '399282c3-f9b4-4a4b-af1b-0019e040ad61'
      };

      beforeEach(async () => {
        result = invoiceLicencesService.mapDBToModel(dbRow);
      });

      test('returns an instance of InvoiceLicence with correct ID', async () => {
        expect(result instanceof InvoiceLicence).to.be.true();
        expect(result.id).to.equal(dbRow.billing_invoice_licence_id);
      });

      test('the invoiceLicence has a company with correct ID', async () => {
        expect(result.company instanceof Company).to.be.true();
        expect(result.company.id).to.equal(dbRow.company_id);
      });

      test('the invoiceLicence has an address with correct ID', async () => {
        expect(result.address instanceof Address).to.be.true();
        expect(result.address.id).to.equal(dbRow.address_id);
      });

      test('the contact is not set', async () => {
        expect(result.contact).to.be.undefined();
      });
    });

    experiment('when there contact ID is set', () => {
      const dbRow = {
        billing_invoice_licence_id: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
        company_id: '40283a80-766f-481f-ba54-484ac0b7ea6d',
        address_id: '399282c3-f9b4-4a4b-af1b-0019e040ad61',
        contact_id: 'b21a7769-942e-4166-a787-a16701f25e4e'
      };

      beforeEach(async () => {
        result = invoiceLicencesService.mapDBToModel(dbRow);
      });

      test('the invoiceLicence has a contact with correct ID', async () => {
        expect(result.contact instanceof Contact).to.be.true();
        expect(result.contact.id).to.equal(dbRow.contact_id);
      });
    });
  });

  experiment('.getByTransactionId', () => {
    let result;

    const dbRow = {
      billing_invoice_licence_id: '4e44ea0b-62fc-4a3d-82ed-6ff563f1e39b',
      company_id: '40283a80-766f-481f-ba54-484ac0b7ea6d',
      address_id: '399282c3-f9b4-4a4b-af1b-0019e040ad61'
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
