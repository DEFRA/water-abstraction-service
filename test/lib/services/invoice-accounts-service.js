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

const invoiceAccountsService = require('../../../src/lib/services/invoice-accounts-service');
const companiesService = require('../../../src/lib/services/companies-service');
const addressesService = require('../../../src/lib/services/addresses-service');
const contactsService = require('../../../src/lib/services/contacts-service');
const invoiceAccountAddressesService = require('../../../src/lib/services/invoice-account-addresses-service');
const regionsService = require('../../../src/lib/services/regions-service');

const Company = require('../../../src/lib/models/company');
const Contact = require('../../../src/lib/models/contact-v2');
const Address = require('../../../src/lib/models/address');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address');

const invoiceAccountsConnector = require('../../../src/lib/connectors/crm-v2/invoice-accounts');
const DateRange = require('../../../src/lib/models/date-range');

const { CONTACT_ROLES } = require('../../../src/lib/models/constants');

const companyId = uuid();
const addressId = uuid();
const agentCompanyId = uuid();
const contactId = uuid();
const invoiceAccountId = uuid();

experiment('modules/billing/services/invoice-accounts-service', () => {
  let connectorResponse;
  beforeEach(async () => {
    connectorResponse = [
      {
        invoiceAccountId: uuid(),
        invoiceAccountNumber: 'A11111111A',
        startDate: '2019-08-12',
        endDate: null,
        dateCreated: '2019-11-25T15:55:38.015Z',
        dateUpdated: '2019-11-25T15:55:38.015Z',
        company: {
          companyId: uuid(),
          name: 'Test company 1',
          type: 'person',
          dateCreated: '2019-11-25T15:55:38.009Z',
          dateUpdated: '2019-11-25T15:55:38.009Z'
        }
      },
      {
        invoiceAccountId: uuid(),
        invoiceAccountNumber: 'A12121212A',
        startDate: '2019-08-12',
        endDate: null,
        dateCreated: '2019-11-25T15:55:38.019Z',
        dateUpdated: '2019-11-25T15:55:38.019Z',
        company: {
          companyId: uuid(),
          name: 'Test company 2',
          type: 'organisation',
          dateCreated: '2019-11-25T15:55:38.013Z',
          dateUpdated: '2019-11-25T15:55:38.013Z'
        }
      }
    ];
    sandbox.stub(invoiceAccountsConnector, 'getInvoiceAccountsByIds').resolves(connectorResponse);
    sandbox.stub(invoiceAccountsConnector, 'getInvoiceAccountById').resolves(connectorResponse[0]);
    sandbox.stub(invoiceAccountsConnector, 'createInvoiceAccount');

    sandbox.stub(invoiceAccountAddressesService, 'deleteInvoiceAccountAddress');
    sandbox.stub(invoiceAccountAddressesService, 'setEndDate');
    sandbox.stub(invoiceAccountAddressesService, 'createInvoiceAccountAddress');

    sandbox.stub(regionsService, 'getRegion');

    sandbox.stub(companiesService, 'createCompany');
    sandbox.stub(companiesService, 'createCompanyContact');
    sandbox.stub(companiesService, 'createCompanyAddress');

    sandbox.stub(addressesService, 'createAddress');

    sandbox.stub(contactsService, 'createContact');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getByInvoiceAccountIds', () => {
    test('passes the invoice account ids to the connector', async () => {
      const ids = [uuid()];
      await invoiceAccountsService.getByInvoiceAccountIds(ids);

      const [passedIds] = invoiceAccountsConnector.getInvoiceAccountsByIds.lastCall.args;

      expect(passedIds).to.equal(ids);
    });

    test('returns the data as InvoiceAccount objects', async () => {
      const response = await invoiceAccountsService.getByInvoiceAccountIds([uuid()]);

      expect(response[0]).to.be.an.instanceOf(InvoiceAccount);
      expect(response[0].id).to.equal(connectorResponse[0].invoiceAccountId);
      expect(response[0].accountNumber).to.equal(connectorResponse[0].invoiceAccountNumber);
      expect(response[0].company).to.be.an.instanceOf(Company);
      expect(response[0].company.id).to.equal(connectorResponse[0].company.companyId);
      expect(response[0].company.name).to.equal(connectorResponse[0].company.name);
      expect(response[0].company.type).to.equal(connectorResponse[0].company.type);

      expect(response[1]).to.be.an.instanceOf(InvoiceAccount);
      expect(response[1].id).to.equal(connectorResponse[1].invoiceAccountId);
      expect(response[1].accountNumber).to.equal(connectorResponse[1].invoiceAccountNumber);
      expect(response[1].company).to.be.an.instanceOf(Company);
      expect(response[1].company.id).to.equal(connectorResponse[1].company.companyId);
      expect(response[1].company.name).to.equal(connectorResponse[1].company.name);
      expect(response[1].company.type).to.equal(connectorResponse[1].company.type);
    });
  });

  experiment('.getByInvoiceAccountId', () => {
    test('passes the invoice account id to the connector', async () => {
      const id = uuid();
      await invoiceAccountsService.getByInvoiceAccountId(id);

      const [passedId] = invoiceAccountsConnector.getInvoiceAccountById.lastCall.args;
      expect(passedId).to.equal(id);
    });

    test('returns the data as an InvoiceAccount object', async () => {
      const response = await invoiceAccountsService.getByInvoiceAccountId(uuid());

      expect(response).to.be.an.instanceOf(InvoiceAccount);
      expect(response.id).to.equal(connectorResponse[0].invoiceAccountId);
      expect(response.accountNumber).to.equal(connectorResponse[0].invoiceAccountNumber);
      expect(response.company).to.be.an.instanceOf(Company);
      expect(response.company.id).to.equal(connectorResponse[0].company.companyId);
      expect(response.company.name).to.equal(connectorResponse[0].company.name);
      expect(response.company.type).to.equal(connectorResponse[0].company.type);
    });
  });

  experiment('.deleteInvoiceAccount', () => {
    beforeEach(async () => {
      sandbox.stub(invoiceAccountsConnector, 'deleteInvoiceAccount').resolves();

      await invoiceAccountsService.deleteInvoiceAccount({ id: 'test-invoice-account-id' });
    });

    test('the id is passed to the connector', () => {
      const [passedId] = invoiceAccountsConnector.deleteInvoiceAccount.lastCall.args;
      expect(passedId).to.equal('test-invoice-account-id');
    });
  });

  experiment('.createInvoiceAccount', () => {
    const regionId = uuid();
    const regionCode = 'A';
    const invoiceAccountId = uuid();
    const companyId = uuid();
    const startDate = '2021-01-01';
    const accountNumber = 'A12345678A';
    let invoiceAccount, result;

    beforeEach(async () => {
      regionsService.getRegion.resolves({
        code: regionCode
      });
      invoiceAccountsConnector.createInvoiceAccount.resolves({
        invoiceAccountId: invoiceAccountId,
        invoiceAccountNumber: accountNumber,
        startDate,
        endDate: null
      });
      invoiceAccount = new InvoiceAccount(invoiceAccountId).fromHash({
        dateRange: new DateRange(startDate, null),
        company: new Company(companyId)
      });
      result = await invoiceAccountsService.createInvoiceAccount(regionId, invoiceAccount);
    });

    test('fetches the region', async () => {
      expect(regionsService.getRegion.calledWith(
        regionId
      )).to.be.true();
    });

    test('calls the invoice accounts connector', async () => {
      expect(invoiceAccountsConnector.createInvoiceAccount.calledWith({
        companyId,
        regionCode,
        startDate
      })).to.be.true();
    });

    test('resolves with an InvoiceAccount model', async () => {
      expect(result).to.be.an.instanceOf(InvoiceAccount);
      expect(result.id).to.equal(invoiceAccountId);
    });
  });

  experiment('.createInvoiceAccountAddress', () => {
    let address, contact, agentCompany, dateRange, invoiceAccountAddress;
    const startDate = '2021-01-01';
    const accountNumber = 'A12345678A';

    beforeEach(async () => {
      // Create test models
      address = new Address().fromHash({
        addressLine2: '123',
        addressLine3: 'Test Terrace',
        town: 'Testington',
        county: 'Testingshire',
        country: 'England',
        postCode: 'TT1 1TT'
      });

      contact = new Contact().fromHash({
        firstName: 'Toby',
        lastName: 'Tested'
      });

      agentCompany = new Company().fromHash({
        name: 'Bottled Water Co'
      });

      dateRange = new DateRange(startDate, null);

      invoiceAccountAddress = new InvoiceAccountAddress().fromHash({
        dateRange,
        address,
        agentCompany: null,
        contact: null
      });

      // Stubs
      invoiceAccountsConnector.getInvoiceAccountById.resolves({
        invoiceAccountId,
        company: {
          companyId
        },
        invoiceAccountNumber: accountNumber
      });

      invoiceAccountAddressesService.createInvoiceAccountAddress.resolves(invoiceAccountAddress);

      addressesService.createAddress.resolves(new Address(addressId));
      contactsService.createContact.resolves(new Contact(contactId));
      companiesService.createCompany.resolves(new Company(agentCompanyId));
    });

    experiment('when the address has no id', () => {
      beforeEach(async () => {
        await invoiceAccountsService.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress);
      });

      test('the invoice account is fetched', async () => {
        expect(invoiceAccountsConnector.getInvoiceAccountById.calledWith(
          invoiceAccountId
        )).to.be.true();
      });

      test('the agent company is not persisted', async () => {
        expect(companiesService.createCompany.called).to.be.false();
      });

      test('the contact is not persisted', async () => {
        expect(contactsService.createContact.called).to.be.false();
      });

      test('the contact is not added to the company', async () => {
        expect(companiesService.createCompanyContact.called).to.be.false();
      });

      test('the address is persisted', async () => {
        expect(addressesService.createAddress.calledWith(
          address
        )).to.be.true();
      });

      test('the address is added to the invoice account company', async () => {
        expect(companiesService.createCompanyAddress.calledWith(
          companyId, addressId, {
            startDate,
            roleName: CONTACT_ROLES.billing
          }
        )).to.be.true();
      });

      test('no existing invoice account addresses are deleted', async () => {
        expect(invoiceAccountAddressesService.deleteInvoiceAccountAddress.called).to.be.false();
      });

      test('no existing invoice account addresses are modified', async () => {
        expect(invoiceAccountAddressesService.setEndDate.called).to.be.false();
      });

      test('the invoice account address is persisted', async () => {
        const { args } = invoiceAccountAddressesService.createInvoiceAccountAddress.lastCall;
        expect(args[0]).to.be.an.instanceOf(InvoiceAccount);
        expect(args[1]).to.be.an.instanceOf(InvoiceAccountAddress);
      });
    });

    experiment('when the address has an existing id', () => {
      beforeEach(async () => {
        address.id = addressId;
        await invoiceAccountsService.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress);
      });

      test('the address is not persisted', async () => {
        expect(addressesService.createAddress.called).to.be.false();
      });

      test('the address is added to the invoice account company', async () => {
        expect(companiesService.createCompanyAddress.calledWith(
          companyId, addressId, {
            startDate,
            roleName: CONTACT_ROLES.billing
          }
        )).to.be.true();
      });
    });

    experiment('when there is an agent with no ID', () => {
      beforeEach(async () => {
        invoiceAccountAddress.agentCompany = agentCompany;
        invoiceAccountAddress.contact = contact;
        await invoiceAccountsService.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress);
      });

      test('the agent company is persisted', async () => {
        expect(companiesService.createCompany.calledWith(agentCompany)).to.be.true();
      });

      test('the address is added to the agent company', async () => {
        expect(companiesService.createCompanyAddress.calledWith(
          agentCompanyId, addressId, {
            startDate,
            roleName: CONTACT_ROLES.billing
          }
        )).to.be.true();
      });

      test('the contact is added to the agent company', async () => {
        expect(companiesService.createCompanyContact.calledWith(
          agentCompanyId, contactId, {
            startDate,
            roleName: CONTACT_ROLES.billing
          }
        )).to.be.true();
      });
    });

    experiment('when there is an agent with an existing ID', () => {
      beforeEach(async () => {
        agentCompany.id = agentCompanyId;
        invoiceAccountAddress.agentCompany = agentCompany;
        invoiceAccountAddress.contact = contact;
        await invoiceAccountsService.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress);
      });

      test('the agent company is not persisted', async () => {
        expect(companiesService.createCompany.called).to.be.false();
      });

      test('the address is added to the agent company', async () => {
        expect(companiesService.createCompanyAddress.calledWith(
          agentCompanyId, addressId, {
            startDate,
            roleName: CONTACT_ROLES.billing
          }
        )).to.be.true();
      });

      test('the contact is added to the agent company', async () => {
        expect(companiesService.createCompanyContact.calledWith(
          agentCompanyId, contactId, {
            startDate,
            roleName: CONTACT_ROLES.billing
          }
        )).to.be.true();
      });

      experiment('when there is an existing open-ended invoice account address record on a previous date', () => {
        const invoiceAccountAddressId = uuid();

        beforeEach(async () => {
          invoiceAccountsConnector.getInvoiceAccountById.resolves({
            invoiceAccountId,
            company: {
              companyId
            },
            invoiceAccountNumber: accountNumber,
            invoiceAccountAddresses: [{
              invoiceAccountId,
              invoiceAccountAddressId,
              startDate: '2020-01-01',
              endDate: null
            }]
          });
          await invoiceAccountsService.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress);
        });

        test('no existing invoice account addresses are deleted', async () => {
          expect(invoiceAccountAddressesService.deleteInvoiceAccountAddress.called).to.be.false();
        });

        test('the end date is modified to one day before the new invoice account address starts', async () => {
          expect(invoiceAccountAddressesService.setEndDate.calledWith(
            invoiceAccountAddressId, '2020-12-31'
          )).to.be.true();
        });
      });

      experiment('when there is an existing overlapping closed-ended invoice account address record on a previous date', () => {
        const invoiceAccountAddressId = uuid();

        beforeEach(async () => {
          invoiceAccountsConnector.getInvoiceAccountById.resolves({
            invoiceAccountId,
            company: {
              companyId
            },
            invoiceAccountNumber: accountNumber,
            invoiceAccountAddresses: [{
              invoiceAccountId,
              invoiceAccountAddressId,
              startDate: '2020-01-01',
              endDate: '2021-02-01'
            }]
          });
          await invoiceAccountsService.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress);
        });

        test('no existing invoice account addresses are deleted', async () => {
          expect(invoiceAccountAddressesService.deleteInvoiceAccountAddress.called).to.be.false();
        });

        test('the end date is modified to one day before the new invoice account address starts', async () => {
          expect(invoiceAccountAddressesService.setEndDate.calledWith(
            invoiceAccountAddressId, '2020-12-31'
          )).to.be.true();
        });
      });

      experiment('when there is an existing non-overlapping closed-ended invoice account address record on a previous date', () => {
        const invoiceAccountAddressId = uuid();

        beforeEach(async () => {
          invoiceAccountsConnector.getInvoiceAccountById.resolves({
            invoiceAccountId,
            company: {
              companyId
            },
            invoiceAccountNumber: accountNumber,
            invoiceAccountAddresses: [{
              invoiceAccountId,
              invoiceAccountAddressId,
              startDate: '2020-01-01',
              endDate: '2020-12-31'
            }]
          });
          await invoiceAccountsService.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress);
        });

        test('no existing invoice account addresses are deleted', async () => {
          expect(invoiceAccountAddressesService.deleteInvoiceAccountAddress.called).to.be.false();
        });

        test('no existing invoice account addresses are modified', async () => {
          expect(invoiceAccountAddressesService.setEndDate.called).to.be.false();
        });
      });

      experiment('when there is an existing invoice account address record starting on the same date', () => {
        const invoiceAccountAddressId = uuid();

        beforeEach(async () => {
          invoiceAccountsConnector.getInvoiceAccountById.resolves({
            invoiceAccountId,
            company: {
              companyId
            },
            invoiceAccountNumber: accountNumber,
            invoiceAccountAddresses: [{
              invoiceAccountId,
              invoiceAccountAddressId,
              startDate: '2021-01-01',
              endDate: null
            }]
          });
          await invoiceAccountsService.createInvoiceAccountAddress(invoiceAccountId, invoiceAccountAddress);
        });

        test('the existing invoice account addresses is deleted', async () => {
          expect(invoiceAccountAddressesService.deleteInvoiceAccountAddress.calledWith(
            invoiceAccountAddressId
          )).to.be.true();
        });

        test('no existing invoice account addresses are modified', async () => {
          expect(invoiceAccountAddressesService.setEndDate.called).to.be.false();
        });
      });
    });
  });

  experiment('.decorateWithInvoiceAccount', () => {
    let model, result;

    beforeEach(async () => {
      model = {
        id: 'test-model-id',
        foo: 'bar',
        invoiceAccount: {
          id: 'test-invoice-account-id'
        }
      };
    });

    experiment('when the invoice account is not null', () => {
      beforeEach(async () => {
        result = await invoiceAccountsService.decorateWithInvoiceAccount(model);
      });

      test('gets invoice account by invoice account id from model', () => {
        const [id] = invoiceAccountsConnector.getInvoiceAccountById.lastCall.args;
        expect(id).to.equal('test-invoice-account-id');
      });

      test('decorates the model with the mapped invoice account', () => {
        expect(result.invoiceAccount).to.be.instanceOf(InvoiceAccount);
        expect(result.invoiceAccount.id).to.equal(connectorResponse[0].invoiceAccountId);
        expect(result.invoiceAccount.accountNumber).to.equal(connectorResponse[0].invoiceAccountNumber);
      });

      test('the rest of the model remains unchanged', () => {
        expect(result.id).to.equal(model.id);
        expect(result.foo).to.equal(model.foo);
      });
    });

    experiment('when the invoice account is null', () => {
      beforeEach(async () => {
        model.invoiceAccount = null;
        result = await invoiceAccountsService.decorateWithInvoiceAccount(model);
      });

      test('does not call the invoice accounts connector', () => {
        expect(invoiceAccountsConnector.getInvoiceAccountById.called).to.be.false();
      });

      test('the model invoiceAccount property is null', () => {
        expect(result.invoiceAccount).to.be.null();
      });

      test('the rest of the model remains unchanged', () => {
        expect(result.id).to.equal(model.id);
        expect(result.foo).to.equal(model.foo);
      });
    });
  });
});
