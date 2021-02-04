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
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address');

const invoiceAccountsConnector = require('../../../src/lib/connectors/crm-v2/invoice-accounts');
const invoiceAccountAddressesConnector = require('../../../src/lib/connectors/crm-v2/invoice-account-addresses');

const messageQueue = require('../../../src/lib/message-queue-v2');
const { jobNames } = require('../../../src/lib/constants');

experiment('modules/billing/services/invoice-account-addreses-service', () => {
  let messageQueueStub;

  beforeEach(async () => {
    messageQueueStub = {
      add: sandbox.stub()
    };
    sandbox.stub(invoiceAccountsConnector, 'createInvoiceAccountAddress');
    sandbox.stub(invoiceAccountAddressesConnector, 'deleteInvoiceAccountAddress').resolves();
    sandbox.stub(invoiceAccountAddressesConnector, 'patchInvoiceAccountAddress').resolves();
    sandbox.stub(messageQueue, 'getQueueManager').returns(messageQueueStub);
  });

  afterEach(async () => {
    sandbox.restore();
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
        contact: new Contact(contactId),
        dateRange: new DateRange('2020-04-01', null)
      });
      invoiceAccountModel.invoiceAccountAddresses.push(invoiceAccountAddressModel);
      invoiceAccountAddressId = uuid();
      invoiceAccountsConnector.createInvoiceAccountAddress.resolves({ ...invoiceAccountAddressData, invoiceAccountAddressId });

      result = await invoiceAccountAddressesService.createInvoiceAccountAddress(invoiceAccountModel, invoiceAccountAddressModel);
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

    test('publishes a job to update the address in the CM', async () => {
      expect(messageQueueStub.add.calledWith(
        jobNames.updateCustomerAccount, invoiceAccountId
      )).to.be.true();
    });
  });

  experiment('.deleteInvoiceAccountAddress', () => {
    const invoiceAccountAddressId = uuid();

    beforeEach(async () => {
      await invoiceAccountAddressesService.deleteInvoiceAccountAddress(invoiceAccountAddressId);
    });

    test('calls the connector method', () => {
      expect(invoiceAccountAddressesConnector.deleteInvoiceAccountAddress.calledWith(
        invoiceAccountAddressId
      )).to.be.true();
    });
  });

  experiment('.setEndDate', () => {
    const invoiceAccountAddressId = uuid();
    const endDate = '2010-01-01';

    beforeEach(async () => {
      await invoiceAccountAddressesService.setEndDate(invoiceAccountAddressId, endDate);
    });

    test('calls the connector method', () => {
      expect(invoiceAccountAddressesConnector.patchInvoiceAccountAddress.calledWith(
        invoiceAccountAddressId,
        {
          endDate
        }
      )).to.be.true();
    });
  });
});
