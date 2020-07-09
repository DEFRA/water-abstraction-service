'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();
const uuid = require('uuid/v4');

const waterServiceRepos = require('../../../../src/lib/connectors/repos');
const crmConnectors = require('../../../../src/lib/connectors/crm-v2');

const invoiceAccountsHelper = require('../../../../src/modules/companies/lib/invoice-accounts');
const invoiceAccountsValidators = require('../../../../src/modules/companies/validators/invoice-accounts');

experiment('modules/companies/lib/invoice-accounts', () => {
  let newAddress, newAgentCompany, newContact, newInvoiceAccount;
  beforeEach(async () => {
    newAddress = {
      addressId: 'new-address',
      address3: '53',
      address4: 'evergreen terrace',
      country: 'USA'
    };
    newAgentCompany = {
      companyId: 'new-agent-company',
      type: 'individual',
      name: 'test-company'
    };
    newContact = {
      contactId: 'new-contact',
      type: 'person',
      firstName: 'Bob',
      lastName: 'Jones'
    };
    newInvoiceAccount = {
      invoiceAccountId: 'test-invoice-account-id',
      invoiceAccountNumber: 'A12345678A',
      startDate: '2020-04-01'
    };
    sandbox.stub(waterServiceRepos.regions, 'findOne').resolves({ chargeRegionId: 'A' });
    sandbox.stub(crmConnectors.addresses, 'createAddress').resolves(newAddress);
    sandbox.stub(crmConnectors.companies, 'createCompany').resolves(newAgentCompany);
    sandbox.stub(crmConnectors.companies, 'createCompanyAddress').resolves();
    sandbox.stub(crmConnectors.companies, 'createCompanyContact').resolves();
    sandbox.stub(crmConnectors.contacts, 'createContact').resolves(newContact);
    sandbox.stub(crmConnectors.invoiceAccounts, 'createInvoiceAccount').resolves(newInvoiceAccount);
    sandbox.stub(crmConnectors.invoiceAccounts, 'createInvoiceAccountAddress').resolves();

    sandbox.stub(invoiceAccountsValidators, 'validateAddress').resolves();
    sandbox.stub(invoiceAccountsValidators, 'validateAgentCompany').resolves();
    sandbox.stub(invoiceAccountsValidators, 'validateContact').resolves();
  });

  afterEach(async () => sandbox.restore());

  experiment('.getInvoiceAccountEntities', () => {
    let request, result;
    beforeEach(async () => {
      request = {
        params: {
          companyId: uuid()
        },
        payload: {
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

      result = await invoiceAccountsHelper.getInvoiceAccountEntities(request);
    });

    experiment('validates the entities in the payload', () => {
      test('does not throw an error if entities are validated', () => {
        const func = async () => await invoiceAccountsHelper.getInvoiceAccountEntities(request);
        expect(func()).to.not.reject();
      });

      test('throws an error if address is not valid', async () => {
        request.payload.address.address1 = 'first floor';
        const func = async () => await invoiceAccountsHelper.getInvoiceAccountEntities(request);
        expect(func()).to.reject();
      });

      test('throws an error if agent is not valid', async () => {
        request.payload.agent.name = 'agent name';
        const func = async () => await invoiceAccountsHelper.getInvoiceAccountEntities(request);
        expect(func()).to.reject();
      });

      test('throws an error if contact is not valid', async () => {
        request.payload.contact.firstName = 'first name';
        const func = async () => await invoiceAccountsHelper.getInvoiceAccountEntities(request);
        expect(func()).to.reject();
      });
    });

    experiment('when address exists', () => {
      test('the addressId is returned', () => {
        expect(result.address).to.equal(request.payload.address);
      });

      test('a new address is not created', () => {
        expect(crmConnectors.addresses.createAddress.called).to.be.false();
      });
    });

    experiment('when new address data is passed in', () => {
      beforeEach(async () => {
        request.payload.address = {
          address3: '53',
          address4: 'evergreen terrace',
          country: 'USA'
        };

        result = await invoiceAccountsHelper.getInvoiceAccountEntities(request);
      });

      test('a new address is created', () => {
        expect(crmConnectors.addresses.createAddress.calledWith(
          request.payload.address
        )).to.be.true();
      });

      test('a new company address is created', () => {
        expect(crmConnectors.companies.createCompanyAddress.called).to.be.true();
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
        expect(crmConnectors.companies.createCompany.called).to.be.false();
      });
    });

    experiment('when agent company does not exist', () => {
      beforeEach(async () => {
        delete request.payload.agent;
        result = await invoiceAccountsHelper.getInvoiceAccountEntities(request);
      });

      test('a new company is not created', () => {
        expect(crmConnectors.companies.createCompany.called).to.be.false();
      });

      test('the agent is returned as null', () => {
        expect(result.agent).to.be.null();
      });
    });

    experiment('when new agent company data is passed in', () => {
      beforeEach(async () => {
        request.payload.agent = {
          type: 'individual',
          name: 'test-company'
        };

        result = await invoiceAccountsHelper.getInvoiceAccountEntities(request);
      });

      test('a new company is created', () => {
        const agentData = {
          ...request.payload.agent,
          type: 'person',
          organisationType: 'individual'
        };
        expect(crmConnectors.companies.createCompany.calledWith(
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
        expect(crmConnectors.contacts.createContact.called).to.be.false();
      });
    });

    experiment('when new contact data is passed in', () => {
      beforeEach(async () => {
        request.payload.contact = {
          type: 'person',
          firstName: 'Bob',
          lastName: 'Jones'
        };

        result = await invoiceAccountsHelper.getInvoiceAccountEntities(request);
      });

      test('a new contact is created', () => {
        expect(crmConnectors.contacts.createContact.calledWith(
          request.payload.contact
        )).to.be.true();
      });

      test('a new company contact is created', () => {
        expect(crmConnectors.companies.createCompanyContact.called).to.be.true();
      });

      test('the new contact is returned', () => {
        expect(result.contact).to.equal(newContact);
      });
    });
  });

  experiment('._createCompanyAddressOrContact', () => {
    experiment('when a new agent company has been created', () => {
      let request, newAgentCompany, newContact;
      beforeEach(async () => {
        request = {
          params: {
            companyId: uuid()
          },
          payload: {
            startDate: '2020-04-01',
            agent: {
              type: 'partnership',
              name: 'Test Company Ltd'
            }
          }
        };

        newAgentCompany = {
          companyId: uuid(),
          ...request.payload.agent
        };
        newContact = {
          contactId: uuid(),
          firstName: 'John',
          lastName: 'Testington'
        };

        await invoiceAccountsHelper._createCompanyAddressOrContact(request, newContact, newAgentCompany, 'contact');
      });

      test('creates the company contact for the new agent company', () => {
        const [companyId] = crmConnectors.companies.createCompanyContact.lastCall.args;
        expect(companyId).to.equal(newAgentCompany.companyId);
      });

      test('passes the correct data to the crm', () => {
        const [, data] = crmConnectors.companies.createCompanyContact.lastCall.args;
        expect(data.contactId).to.equal(newContact.contactId);
        expect(data.roleName).to.equal('billing');
        expect(data.isDefault).to.equal(true);
        expect(data.startDate).to.equal(request.payload.startDate);
      });
    });

    experiment('when adding a new entity to an existing agent company', () => {
      let request, agentCompany, newAddress;
      beforeEach(async () => {
        agentCompany = { companyId: uuid() };
        request = {
          params: {
            companyId: uuid()
          },
          payload: {
            startDate: '2020-04-01',
            agent: agentCompany
          }
        };

        newAddress = {
          addressId: uuid(),
          address3: '25',
          address4: 'Test Lane',
          town: 'Teston-super-mare',
          country: 'England'
        };

        await invoiceAccountsHelper._createCompanyAddressOrContact(request, newAddress, agentCompany, 'address');
      });

      test('creates the company address for the existing agent company', () => {
        const [companyId] = crmConnectors.companies.createCompanyAddress.lastCall.args;
        expect(companyId).to.equal(agentCompany.companyId);
      });

      test('passes the correct data to the crm', () => {
        const [, data] = crmConnectors.companies.createCompanyAddress.lastCall.args;
        expect(data.addressId).to.equal(newAddress.addressId);
        expect(data.roleName).to.equal('billing');
        expect(data.isDefault).to.equal(true);
        expect(data.startDate).to.equal(request.payload.startDate);
      });
    });

    experiment('when there is no agent company', () => {
      let request, newAddress;
      beforeEach(async () => {
        request = {
          params: {
            companyId: uuid()
          },
          payload: {
            startDate: '2020-04-01'
          }
        };

        newAddress = {
          addressId: uuid(),
          address3: '25',
          address4: 'Test Lane',
          town: 'Teston-super-mare',
          country: 'England'
        };

        await invoiceAccountsHelper._createCompanyAddressOrContact(request, newAddress, null, 'address');
      });

      test('creates the company address for the existing agent company', () => {
        const [companyId] = crmConnectors.companies.createCompanyAddress.lastCall.args;
        expect(companyId).to.equal(request.params.companyId);
      });

      test('passes the correct data to the crm', () => {
        const [, data] = crmConnectors.companies.createCompanyAddress.lastCall.args;
        expect(data.addressId).to.equal(newAddress.addressId);
        expect(data.roleName).to.equal('licenceHolder');
        expect(data.isDefault).to.equal(true);
        expect(data.startDate).to.equal(request.payload.startDate);
      });
    });
  });

  experiment('.createInvoiceAccountAndRoles', () => {
    let request, result;
    beforeEach(async () => {
      request = {
        params: {
          companyId: 'test-company-id'
        },
        payload: {
          startDate: '2020-04-01',
          regionId: 'test-region-id'
        }
      };

      const address = { addressId: 'test-address-id' };
      const contact = { contactId: 'test-contact-id' };

      result = await invoiceAccountsHelper.createInvoiceAccountAndRoles(request, address, null, contact);
    });

    test('calls the water service to get the region code', () => {
      expect(waterServiceRepos.regions.findOne.calledWith(
        request.payload.regionId
      )).to.be.true();
    });

    test('calls the crm to create an invoice account', () => {
      const invoiceAccountData = {
        companyId: request.params.companyId,
        regionCode: 'A',
        startDate: request.payload.startDate
      };
      expect(crmConnectors.invoiceAccounts.createInvoiceAccount.calledWith(
        invoiceAccountData
      )).to.be.true();
    });

    test('calls the crm to create an invoice account address', () => {
      const invoiceAccountAddressData = {
        startDate: request.payload.startDate,
        addressId: 'test-address-id',
        agentCompanyId: null,
        contactId: 'test-contact-id'
      };
      expect(crmConnectors.invoiceAccounts.createInvoiceAccountAddress.calledWith(
        'test-invoice-account-id', invoiceAccountAddressData
      )).to.be.true();
    });

    test('returns the newly created invoice account', () => {
      expect(result).to.equal(newInvoiceAccount);
    });
  });

  experiment('.getNewEntities', () => {
    test('returns all entities which contain multiple keys', () => {
      const result = invoiceAccountsHelper.getNewEntities(
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
      const result = invoiceAccountsHelper.getNewEntities(
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
      const result = invoiceAccountsHelper.getNewEntities(
        newInvoiceAccount,
        newAddress,
        null,
        newContact);
      expect(result.agent).to.be.undefined();
    });
  });
});
