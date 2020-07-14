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
const regionsService = require('../../../src/lib/services/regions-service');

const Company = require('../../../src/lib/models/company');
const Contact = require('../../../src/lib/models/contact-v2');
const Address = require('../../../src/lib/models/address');
const InvoiceAccount = require('../../../src/lib/models/invoice-account');
const InvoiceAccountAddress = require('../../../src/lib/models/invoice-account-address');

const mappers = require('../../../src/lib/mappers');

const invoiceAccountsConnector = require('../../../src/lib/connectors/crm-v2/invoice-accounts');

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

  experiment('.getInvoiceAccountEntities', () => {
    let request, result;
    beforeEach(async () => {
      request = {
        params: {
          companyId: uuid()
        },
        payload: {
          startDate: '2020-04-01',
          address: {
            addressId: uuid()
          },
          agent: {
            companyId: uuid()
          },
          contact: {
            contactId: uuid()
          }
        }
      };
      sandbox.stub(addressesService, 'createAddress').resolves();
      sandbox.stub(companiesService, 'createCompany').resolves();
      sandbox.stub(contactsService, 'createContact').resolves();
      sandbox.stub(companiesService, 'createCompanyAddress').resolves();
      sandbox.stub(companiesService, 'createCompanyContact').resolves();

      result = await invoiceAccountsService.getInvoiceAccountEntities(request);
    });

    experiment('validates the entities in the payload', () => {
      test('does not throw an error if entities are validated', () => {
        const func = async () => await invoiceAccountsService.getInvoiceAccountEntities(request);
        expect(func()).to.not.reject();
      });

      test('throws an error if address is not valid', async () => {
        request.payload.address.address1 = 'first floor';
        const func = async () => await invoiceAccountsService.getInvoiceAccountEntities(request);
        expect(func()).to.reject();
      });

      test('throws an error if agent is not valid', async () => {
        request.payload.agent.name = 'agent name';
        const func = async () => await invoiceAccountsService.getInvoiceAccountEntities(request);
        expect(func()).to.reject();
      });

      test('throws an error if contact is not valid', async () => {
        request.payload.contact.firstName = 'first name';
        const func = async () => await invoiceAccountsService.getInvoiceAccountEntities(request);
        expect(func()).to.reject();
      });
    });

    experiment('when address exists', () => {
      test('the addressId is returned', () => {
        expect(result.address).to.equal(request.payload.address);
      });

      test('a new address is not created', () => {
        expect(addressesService.createAddress.called).to.be.false();
      });
    });

    experiment('when new address data is passed in', () => {
      let addressId, newAddress;
      beforeEach(async () => {
        request.payload.address = {
          addressLine3: '742',
          addressLine4: 'evergreen terrace',
          country: 'USA'
        };
        addressId = uuid();
        newAddress = new Address(addressId);
        newAddress.fromHash({
          address3: '742',
          address4: 'evergreen terrace',
          country: 'USA'
        });

        addressesService.createAddress.resolves(newAddress);

        result = await invoiceAccountsService.getInvoiceAccountEntities(request);
      });

      test('a new address is created', () => {
        expect(addressesService.createAddress.calledWith(
          request.payload.address
        )).to.be.true();
      });

      test('a new company address is created with correct data', () => {
        const expectedData = {
          addressId,
          roleName: 'billing',
          isDefault: true,
          startDate: request.payload.startDate
        };
        expect(companiesService.createCompanyAddress.calledWith(
          request.payload.agent.companyId, expectedData
        )).to.be.true();
      });

      test('the new address is returned', () => {
        expect(result.address).to.equal(newAddress);
      });
    });

    experiment('when agent company exists', () => {
      test('the companyId is returned', () => {
        expect(result.agent).to.equal(request.payload.agent);
      });

      test('a new company is not created', () => {
        expect(companiesService.createCompany.called).to.be.false();
      });
    });

    experiment('when agent company does not exist', () => {
      beforeEach(async () => {
        delete request.payload.agent;
        result = await invoiceAccountsService.getInvoiceAccountEntities(request);
      });

      test('a new company is not created', () => {
        expect(companiesService.createCompany.called).to.be.false();
      });

      test('the agent is returned as null', () => {
        expect(result.agent).to.be.null();
      });
    });

    experiment('when new agent company data is passed in', () => {
      let newAgentCompany;
      beforeEach(async () => {
        request.payload.agent = {
          type: 'individual',
          name: 'test-company'
        };
        newAgentCompany = new Company();
        newAgentCompany.fromHash({
          companyId: uuid(),
          type: 'person',
          organistionType: 'individual',
          name: 'test-company'
        });
        companiesService.createCompany.resolves(newAgentCompany);
        result = await invoiceAccountsService.getInvoiceAccountEntities(request);
      });

      test('a new company is created', () => {
        const agentData = {
          ...request.payload.agent,
          type: 'person',
          organisationType: 'individual'
        };
        expect(companiesService.createCompany.calledWith(
          agentData
        )).to.be.true();
      });

      test('the new agent company is returned', () => {
        expect(result.agent).to.equal(newAgentCompany);
      });
    });

    experiment('when contact exists', () => {
      test('the contactId is returned', () => {
        expect(result.contact).to.equal(request.payload.contact);
      });

      test('a new contact is not created', () => {
        expect(contactsService.createContact.called).to.be.false();
      });
    });

    experiment('when new contact data is passed in', () => {
      let contactId, newContact;
      beforeEach(async () => {
        request.payload.contact = {
          type: 'person',
          firstName: 'Bob',
          lastName: 'Jones'
        };
        contactId = uuid();
        newContact = new Contact(contactId);
        newContact.fromHash({
          type: 'person',
          firstName: 'Bob',
          lastName: 'Jones'
        });
        contactsService.createContact.resolves(newContact);

        result = await invoiceAccountsService.getInvoiceAccountEntities(request);
      });

      test('a new contact is created', () => {
        expect(contactsService.createContact.calledWith(
          request.payload.contact
        )).to.be.true();
      });

      test('a new company address is created with correct data', () => {
        const expectedData = {
          contactId,
          roleName: 'billing',
          isDefault: true,
          startDate: request.payload.startDate
        };
        expect(companiesService.createCompanyContact.calledWith(
          request.payload.agent.companyId, expectedData
        )).to.be.true();
      });

      test('the new contact is returned', () => {
        expect(result.contact).to.equal(newContact);
      });
    });
  });

  experiment('.createInvoiceAccount', () => {
    let companyId, regionId, request, invoiceAccountData, invoiceAccountModel, response;
    beforeEach(async () => {
      companyId = uuid();
      regionId = uuid();
      request = {
        params: {
          companyId
        },
        payload: {
          regionId,
          startDate: '2020-04-01'
        }
      };
      invoiceAccountData = {
        invoiceAccountId: uuid(),
        accountNumber: 'N12345678A'
      };
      invoiceAccountModel = new InvoiceAccount();

      sandbox.stub(regionsService, 'getRegionCode').resolves('N');
      sandbox.stub(invoiceAccountsConnector, 'createInvoiceAccount').resolves(invoiceAccountData);
      sandbox.stub(mappers.invoiceAccount, 'crmToModel').resolves(invoiceAccountModel);

      response = await invoiceAccountsService.createInvoiceAccount(request);
    });

    test('calls the regions service to get the region code', async () => {
      expect(regionsService.getRegionCode.calledWith(
        regionId
      )).to.be.true();
    });

    test('calls the invoice accounts connector with the expected data', async () => {
      expect(invoiceAccountsConnector.createInvoiceAccount.calledWith({
        companyId,
        regionCode: 'N',
        startDate: request.payload.startDate
      })).to.be.true();
    });

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [data] = mappers.invoiceAccount.crmToModel.lastCall.args;
      expect(data).to.equal(invoiceAccountData);
    });

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(invoiceAccountModel);
    });
  });

  experiment('.createInvoiceAccountAddress', () => {
    let companyId, invoiceAccount, request, invoiceAccountAddressData, invoiceAccountAddressModel, response;
    beforeEach(async () => {
      companyId = uuid();
      request = {
        params: {
          companyId
        },
        payload: {
          startDate: '2020-04-01',
          address: { addressId: uuid() },
          agent: { companyId: uuid() },
          contact: { contactId: uuid() }
        }
      };
      invoiceAccount = new InvoiceAccount();
      invoiceAccount.fromHash({
        invoiceAccountId: uuid(),
        accountNumber: 'N12345678A'
      });
      invoiceAccountAddressData = {
        invoiceAccountAddressId: uuid()
      };
      invoiceAccountAddressModel = new InvoiceAccountAddress();

      sandbox.stub(invoiceAccountsConnector, 'createInvoiceAccountAddress').resolves(invoiceAccountAddressData);
      sandbox.stub(mappers.invoiceAccountAddress, 'crmToModel').resolves(invoiceAccountAddressModel);

      response = await invoiceAccountsService.createInvoiceAccountAddress(request, invoiceAccount, request.payload.address, request.payload.agent, request.payload.contact);
    });

    test('calls the invoice accounts connector with the expected data', async () => {
      const expectedData = {
        startDate: request.payload.startDate,
        addressId: request.payload.address.addressId,
        agentCompanyId: request.payload.agent.companyId,
        contactId: request.payload.contact.contactId
      };
      expect(invoiceAccountsConnector.createInvoiceAccountAddress.calledWith(
        invoiceAccount.id, expectedData
      )).to.be.true();
    });

    test('calls the crm to model mapper with the output of the crm call', async () => {
      const [data] = mappers.invoiceAccountAddress.crmToModel.lastCall.args;
      expect(data).to.equal(invoiceAccountAddressData);
    });

    test('returns the output from the mapper', async () => {
      expect(response).to.equal(invoiceAccountAddressModel);
    });

    test('passes the correct address id to invoice accounts connector when a new address is passed in', async () => {
      delete request.payload.address;
      await invoiceAccountsService.createInvoiceAccountAddress(request, invoiceAccount, { id: 'address-id' }, request.payload.agent, request.payload.contact);

      const [, data] = invoiceAccountsConnector.createInvoiceAccountAddress.lastCall.args;
      expect(data.addressId).to.equal('address-id');
    });

    test('passes the correct agent id to invoice accounts connector when a new agent is passed in', async () => {
      delete request.payload.agent;
      await invoiceAccountsService.createInvoiceAccountAddress(request, invoiceAccount, { id: 'address-id' }, { id: 'agent-company-id' }, request.payload.contact);

      const [, data] = invoiceAccountsConnector.createInvoiceAccountAddress.lastCall.args;
      expect(data.agentCompanyId).to.equal('agent-company-id');
    });

    test('passes null to invoice accounts connector when there is no agent', async () => {
      delete request.payload.agent;
      await invoiceAccountsService.createInvoiceAccountAddress(request, invoiceAccount, { id: 'address-id' }, null, request.payload.contact);

      const [, data] = invoiceAccountsConnector.createInvoiceAccountAddress.lastCall.args;
      expect(data.agentCompanyId).to.equal(null);
    });

    test('passes the correct contact id to invoice accounts connector when a new address is passed in', async () => {
      delete request.payload.contact;
      await invoiceAccountsService.createInvoiceAccountAddress(request, invoiceAccount, { id: 'address-id' }, { id: 'agent-company-id' }, { id: 'contact-id' });

      const [, data] = invoiceAccountsConnector.createInvoiceAccountAddress.lastCall.args;
      expect(data.contactId).to.equal('contact-id');
    });
  });

  experiment('.getNewEntities', () => {
    let newInvoiceAccount, newAddress, newAgentCompany, newContact;
    beforeEach(() => {
      newInvoiceAccount = new InvoiceAccount(uuid());
      newInvoiceAccount.accountNumber = 'N12345678A';

      newAddress = new Address(uuid());
      newAddress.fromHash({
        address3: '742',
        address4: 'evergreen terrace',
        country: 'USA'
      });

      newAgentCompany = new Company(uuid());
      newAgentCompany.fromHash({
        type: 'person',
        organistionType: 'individual',
        name: 'test-company'
      });

      newContact = new Contact(uuid());
      newContact.fromHash({
        type: 'person',
        firstName: 'Bob',
        lastName: 'Jones'
      });
    });
    test('returns all entities which contain multiple keys', () => {
      const result = invoiceAccountsService.getNewEntities(
        newInvoiceAccount,
        newAddress,
        newAgentCompany,
        newContact);

      expect(result.invoiceAccount).to.equal(newInvoiceAccount);
      expect(result.address).to.equal(newAddress);
      expect(result.agent).to.equal(newAgentCompany);
      expect(result.contact).to.equal(newContact);
    });

    test('does not return entities which only contain id', () => {
      const result = invoiceAccountsService.getNewEntities(
        newInvoiceAccount,
        { addressId: uuid() },
        { companyId: uuid() },
        newContact);
      expect(result.invoiceAccount).to.equal(newInvoiceAccount);
      expect(result.address).to.be.undefined();
      expect(result.agent).to.be.undefined();
      expect(result.contact).to.equal(newContact);
    });

    test('handles a null agent company', () => {
      const result = invoiceAccountsService.getNewEntities(
        newInvoiceAccount,
        newAddress,
        null,
        newContact);
      expect(result.agent).to.be.undefined();
    });
  });
});
