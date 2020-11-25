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
const crmService = require('../../../src/lib/services/crm-service');
const messageQueue = require('../../../src/lib/message-queue');

const Company = require('../../../src/lib/models/company');
const Contact = require('../../../src/lib/models/contact-v2');
const Address = require('../../../src/lib/models/address');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address');

const invoiceAccountsConnector = require('../../../src/lib/connectors/crm-v2/invoice-accounts');
const addressesConnector = require('../../../src/lib/connectors/crm-v2/addresses');
const companiesConnector = require('../../../src/lib/connectors/crm-v2/companies');
const contactsConnector = require('../../../src/lib/connectors/crm-v2/contacts');
const DateRange = require('../../../src/lib/models/date-range');

const invoiceAccountJobs = require('../../../src/modules/billing/jobs/update-customer');

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

  experiment('.getInvoiceAccount', () => {
    let result, address, agentCompany, contact, addressModel, agentCompanyModel, contactModel, invoiceAccountModel,
      invoiceAccountAddressModel;
    beforeEach(async () => {
      address = {
        addressId
      };
      agentCompany = {
        companyId: agentCompanyId
      };
      contact = {
        contactId
      };

      addressModel = new Address(addressId);
      agentCompanyModel = new Company(agentCompanyId);
      contactModel = new Contact(contactId);
      invoiceAccountAddressModel = new InvoiceAccountAddress();
      invoiceAccountAddressModel.dateRange = new DateRange('2020-04-01');
      invoiceAccountAddressModel.address = addressModel;
      invoiceAccountAddressModel.agentCompany = agentCompanyModel;
      invoiceAccountAddressModel.contact = contactModel;

      invoiceAccountModel = new InvoiceAccount();
      invoiceAccountModel.company = new Company(companyId);
      invoiceAccountModel.invoiceAccountAddresses.push(invoiceAccountAddressModel);

      sandbox.stub(addressesService, 'getAddressModel').returns(addressModel);
      sandbox.stub(companiesService, 'getCompanyModel').returns(agentCompanyModel);
      sandbox.stub(contactsService, 'getContactModel').returns(contactModel);
      sandbox.stub(invoiceAccountAddressesService, 'getInvoiceAccountAddressModel').returns(invoiceAccountAddressModel);

      result = await invoiceAccountsService.getInvoiceAccount(companyId, '2020-04-01', address, agentCompany, contact);
    });

    test('gets the address model', () => {
      expect(addressesService.getAddressModel.calledWith(
        address
      )).to.be.true();
    });

    test('gets the agent company model', () => {
      expect(companiesService.getCompanyModel.calledWith(
        agentCompany
      )).to.be.true();
    });

    test('gets the contact model', () => {
      expect(contactsService.getContactModel.calledWith(
        contact
      )).to.be.true();
    });

    test('gets the invoice account address model', () => {
      expect(invoiceAccountAddressesService.getInvoiceAccountAddressModel.calledWith(
        '2020-04-01',
        addressModel,
        agentCompanyModel,
        contactModel
      )).to.be.true();
    });

    test('returns an invoice account model containing the expected models', () => {
      expect(result).to.be.instanceOf(InvoiceAccount);

      expect(result.company).to.be.instanceOf(Company);
      expect(result.company.id).to.equal(companyId);
      expect(result.invoiceAccountAddresses[0]).to.be.instanceOf(InvoiceAccountAddress);
      expect(result.invoiceAccountAddresses[0]).to.equal(invoiceAccountAddressModel);
      expect(result.invoiceAccountAddresses[0].address).to.be.instanceOf(Address);
      expect(result.invoiceAccountAddresses[0].address).to.equal(addressModel);
      expect(result.invoiceAccountAddresses[0].agentCompany).to.be.instanceOf(Company);
      expect(result.invoiceAccountAddresses[0].agentCompany).to.equal(agentCompanyModel);
      expect(result.invoiceAccountAddresses[0].contact).to.be.instanceOf(Contact);
      expect(result.invoiceAccountAddresses[0].contact).to.equal(contactModel);
    });
  });

  experiment('.persist', () => {
    let regionId, invoiceAccountData, addressModel, agentCompanyModel, contactModel, invoiceAccountModel,
      invoiceAccountAddressModel;
    beforeEach(async () => {
      regionId = uuid();
      invoiceAccountData = {
        invoiceAccountId: invoiceAccountId,
        invoiceAccountNumber: 'N12345678A'
      };

      addressModel = new Address(addressId);
      agentCompanyModel = new Company(agentCompanyId);
      contactModel = new Contact(contactId);
      invoiceAccountAddressModel = new InvoiceAccountAddress();
      invoiceAccountAddressModel.dateRange = new DateRange('2020-04-01');
      invoiceAccountAddressModel.address = addressModel;
      invoiceAccountAddressModel.agentCompany = agentCompanyModel;
      invoiceAccountAddressModel.contact = contactModel;

      invoiceAccountModel = new InvoiceAccount();
      invoiceAccountModel.company = new Company(companyId);
      invoiceAccountModel.invoiceAccountAddresses.push(invoiceAccountAddressModel);

      sandbox.stub(addressesConnector, 'createAddress').resolves();
      sandbox.stub(companiesConnector, 'createCompany').resolves();
      sandbox.stub(contactsConnector, 'createContact').resolves();
      sandbox.stub(companiesService, 'createCompanyAddress').resolves();
      sandbox.stub(companiesService, 'createCompanyContact').resolves();
      sandbox.stub(invoiceAccountsConnector, 'createInvoiceAccount').resolves(invoiceAccountData);
      sandbox.stub(regionsService, 'getRegion').resolves({ code: 'N' });
      sandbox.stub(invoiceAccountAddressesService, 'createInvoiceAccountAddress').resolves(invoiceAccountAddressModel);
      sandbox.stub(crmService, 'deleteEntities').resolves();
      sandbox.stub(messageQueue, 'publish').resolves();
      await invoiceAccountsService.persist(regionId, '2020-04-01', invoiceAccountModel);
    });

    test('calls the regions service to get the region code', async () => {
      expect(regionsService.getRegion.calledWith(
        regionId
      )).to.be.true();
    });

    test('calls the invoice accounts connector with the expected data', async () => {
      expect(invoiceAccountsConnector.createInvoiceAccount.calledWith({
        companyId,
        regionCode: 'N',
        startDate: '2020-04-01'
      })).to.be.true();
    });

    test('updates the invoice account model', async () => {
      expect(invoiceAccountModel.id).to.equal(invoiceAccountData.invoiceAccountId);
      expect(invoiceAccountModel.accountNumber).to.equal(invoiceAccountData.invoiceAccountNumber);
    });

    test('calls the invoice account addresses connector with the expected data', async () => {
      expect(invoiceAccountAddressesService.createInvoiceAccountAddress.calledWith(
        invoiceAccountModel,
        invoiceAccountAddressModel,
        '2020-04-01'
      )).to.be.true();
    });

    experiment('when the address already exists', () => {
      test('does not call the address service', () => {
        expect(addressesConnector.createAddress.called).to.be.false();
      });

      test('does not create a company address', () => {
        expect(companiesService.createCompanyAddress.called).to.be.false();
      });
    });

    experiment('when the new address data is provided', () => {
      beforeEach(async () => {
        const addressData = {
          addressLine2: '123',
          addressLine3: 'Test Terrace',
          town: 'Testington',
          county: 'Testingshire',
          country: 'England',
          postCode: 'TT11TT'
        };
        addressModel = new Address();
        addressModel.fromHash(addressData);

        invoiceAccountModel.invoiceAccountAddresses[0].address = addressModel;
        addressesConnector.createAddress.resolves({ ...addressData, addressId });

        await invoiceAccountsService.persist(regionId, '2020-04-01', invoiceAccountModel);
      });

      test('calls the address service', () => {
        expect(addressesConnector.createAddress.called).to.be.true();
      });

      test('decorates the invoice account with the new address model', () => {
        expect(invoiceAccountModel.invoiceAccountAddresses[0].address.id).to.equal(addressId);
      });

      test('creates a company address', () => {
        const [compId, data] = companiesService.createCompanyAddress.lastCall.args;
        expect(compId).to.equal(invoiceAccountModel.invoiceAccountAddresses[0].agentCompany.id);
        expect(data).to.equal({
          roleName: 'billing',
          isDefault: true,
          startDate: '2020-04-01',
          addressId
        });
      });

      test('links to the company if agent does not exist', async () => {
        invoiceAccountModel.invoiceAccountAddresses[0].agentCompany = null;
        await invoiceAccountsService.persist(regionId, '2020-04-01', invoiceAccountModel);

        const [compId, data] = companiesService.createCompanyAddress.lastCall.args;

        expect(compId).to.equal(invoiceAccountModel.company.id);
        expect(data).to.equal({
          roleName: 'licenceHolder',
          isDefault: true,
          startDate: '2020-04-01',
          addressId
        });
      });
    });

    experiment('when the agent company already exists', () => {
      test('does not call the company service ', () => {
        expect(companiesConnector.createCompany.called).to.be.false();
      });
    });

    experiment('when the new agent company data is provided', () => {
      beforeEach(async () => {
        const agentData = {
          type: Company.COMPANY_TYPES.organisation,
          name: 'Test Company Ltd',
          organisationType: Company.ORGANISATION_TYPES.limitedCompany
        };
        agentCompanyModel = new Company();
        agentCompanyModel.fromHash(agentData);

        invoiceAccountModel.invoiceAccountAddresses[0].agentCompany = agentCompanyModel;
        companiesConnector.createCompany.resolves({ ...agentData, companyId: agentCompanyId });

        await invoiceAccountsService.persist(regionId, '2020-04-01', invoiceAccountModel);
      });

      test('calls the companies service', () => {
        expect(companiesConnector.createCompany.called).to.be.true();
      });

      test('decorates the invoice account with the new agent company model', () => {
        expect(invoiceAccountModel.invoiceAccountAddresses[0].agentCompany.id).to.equal(agentCompanyId);
      });
    });

    experiment('when the contact already exists', () => {
      test('does not call the contact service', () => {
        expect(contactsConnector.createContact.called).to.be.false();
      });

      test('does not create a company contact', () => {
        expect(companiesService.createCompanyContact.called).to.be.false();
      });
    });

    experiment('when the new contact data is provided', () => {
      beforeEach(async () => {
        const contactData = {
          type: Contact.CONTACT_TYPES.person,
          firstName: 'Tommy',
          lastName: 'Test'
        };
        contactModel = new Contact();
        contactModel.fromHash(contactData);

        invoiceAccountModel.invoiceAccountAddresses[0].contact = contactModel;
        contactsConnector.createContact.resolves({ ...contactData, contactId });

        await invoiceAccountsService.persist(regionId, '2020-04-01', invoiceAccountModel);
      });

      test('calls the contact service', () => {
        expect(contactsConnector.createContact.called).to.be.true();
      });

      test('decorates the invoice account with the new contact model', () => {
        expect(invoiceAccountModel.invoiceAccountAddresses[0].contact.id).to.equal(contactId);
      });

      test('creates a company contact', () => {
        const [compId, data] = companiesService.createCompanyContact.lastCall.args;
        expect(compId).to.equal(invoiceAccountModel.invoiceAccountAddresses[0].agentCompany.id);
        expect(data).to.equal({
          roleName: 'billing',
          isDefault: true,
          startDate: '2020-04-01',
          contactId
        });
      });
    });

    test('deletes already created entities when there is an error and re-throws', async () => {
      invoiceAccountAddressesService.createInvoiceAccountAddress.throws(new Error('oopsies!'));
      try {
        await invoiceAccountsService.persist(regionId, '2020-04-01', invoiceAccountModel);
      } catch (err) {
        const newModels = [invoiceAccountModel];
        expect(crmService.deleteEntities.calledWith(
          newModels
        )).to.be.true();
        expect(err.message).to.equal('oopsies!');
      }
    });
  });

  experiment('._isNewEntity', () => {
    test('returns false when entity only contains id field', () => {
      const result = invoiceAccountsService._isNewEntity(new Address(uuid()));
      expect(result).to.be.false();
    });

    test('returns false when entity contains id field and empty arrays', () => {
      const result = invoiceAccountsService._isNewEntity(new Company(uuid()));
      expect(result).to.be.false();
    });

    test('returns true when entity contains multiple pieces of data', () => {
      const contact = new Contact();
      contact.fromHash({
        type: Contact.CONTACT_TYPES.person,
        firsName: 'Tommy',
        lastName: 'Test'
      });
      const result = invoiceAccountsService._isNewEntity(contact);
      expect(result).to.be.true();
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
