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

const invoiceAccountAddressesService = require('../../../src/lib/services/invoice-account-addresses-service');

const DateRange = require('../../../src/lib/models/date-range');
const Contact = require('../../../src/lib/models/contact-v2');
const Address = require('../../../src/lib/models/address');
const Company = require('../../../src/lib/models/company');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address');

const invoiceAccountsConnector = require('../../../src/lib/connectors/crm-v2/invoice-accounts');

experiment('modules/billing/services/invoice-account-addreses-service', () => {
  beforeEach(async () => {
    sandbox.stub(invoiceAccountsConnector, 'createInvoiceAccountAddress');
    sandbox.stub(invoiceAccountsConnector, 'deleteInvoiceAccountAddress').resolves();
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getInvoiceAccountAddressModel', () => {
    let response, addressModel, agentCompanyModel, contactModel;
    beforeEach(() => {
      addressModel = new Address(uuid());
      agentCompanyModel = new Company(uuid());
      contactModel = new Contact(uuid());

      response = invoiceAccountAddressesService.getInvoiceAccountAddressModel('2020-04-01', addressModel, agentCompanyModel, contactModel);
    });

    test('returns an InvoiceAccountAddress instance', () => {
      expect(response).to.be.instanceOf(InvoiceAccountAddress);
    });

    test('maps the date range properly', () => {
      expect(response.dateRange).to.be.instanceOf(DateRange);
      expect(response.dateRange.startDate).to.equal('2020-04-01');
    });

    test('maps the address properly', () => {
      expect(response.address).to.equal(addressModel);
    });

    test('maps the agent company properly', () => {
      expect(response.agentCompany).to.equal(agentCompanyModel);
    });

    test('maps the contact properly', () => {
      expect(response.contact).to.equal(contactModel);
    });
  });

  experiment('.createInvoiceAccountAddress', () => {
    let invoiceAccountModel, invoiceAccountAddressModel, invoiceAccountId, invoiceAccountAddressId, result;
    beforeEach(async () => {
      const addressId = uuid();
      const contactId = uuid();
      invoiceAccountId = uuid();
      invoiceAccountModel = new InvoiceAccount(invoiceAccountId);
      const invoiceAccountAddressData = {
        address: { addressId },
        agentCompanyId: null,
        contact: { contactId },
        invoiceAccountId
      };
      invoiceAccountAddressModel = new InvoiceAccountAddress();
      invoiceAccountAddressModel.fromHash({
        invoiceAccountId,
        address: new Address(addressId),
        agentCompany: null,
        contact: new Contact(contactId)
      });
      invoiceAccountModel.invoiceAccountAddresses.push(invoiceAccountAddressModel);
      invoiceAccountAddressId = uuid();
      invoiceAccountsConnector.createInvoiceAccountAddress.resolves({ ...invoiceAccountAddressData, invoiceAccountAddressId });

      result = await invoiceAccountAddressesService.createInvoiceAccountAddress(invoiceAccountModel, invoiceAccountAddressModel, '2020-04-01');
    });

    test('persists the invoice account address', () => {
      const [id, data] = invoiceAccountsConnector.createInvoiceAccountAddress.lastCall.args;
      expect(id).to.equal(invoiceAccountId);
      expect(data).to.equal({
        addressId: invoiceAccountAddressModel.address.id,
        startDate: '2020-04-01',
        agentCompanyId: null,
        contactId: invoiceAccountAddressModel.contact.id
      });
    });

    test('returns the invoice account address', () => {
      expect(result).to.be.instanceOf(InvoiceAccountAddress);
      expect(result.id).to.equal(invoiceAccountAddressId);
    });
  });

  experiment('.deleteInvoiceAccount', () => {
    let invoiceAccountAddressModel, invoiceAccountId, invoiceAccountAddressId;
    beforeEach(async () => {
      invoiceAccountId = uuid();
      invoiceAccountAddressId = uuid();
      invoiceAccountAddressModel = new InvoiceAccountAddress(invoiceAccountAddressId);
      invoiceAccountAddressModel.fromHash({
        address: new Address(uuid()),
        agentCompany: null,
        contact: new Contact(uuid()),
        invoiceAccountId
      });
      await invoiceAccountAddressesService.deleteInvoiceAccountAddress(invoiceAccountAddressModel);
    });

    test('the invoice account and invoice account address ids are passed to the connector', () => {
      const [invoiceId, addressId] = invoiceAccountsConnector.deleteInvoiceAccountAddress.lastCall.args;
      expect(invoiceId).to.equal(invoiceAccountId);
      expect(addressId).to.equal(invoiceAccountAddressId);
    });
  });
});
