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
    sandbox.stub(crmConnectors.contacts, 'createContact').resolves(newContact);
    sandbox.stub(crmConnectors.invoiceAccounts, 'createInvoiceAccount').resolves(newInvoiceAccount);
    sandbox.stub(crmConnectors.invoiceAccounts, 'createInvoiceAccountAddress').resolves();

    sandbox.stub(invoiceAccountsValidators, 'validateAddress').resolves();
    sandbox.stub(invoiceAccountsValidators, 'validateAgentCompany').resolves();
    sandbox.stub(invoiceAccountsValidators, 'validateContact').resolves();
  });

  afterEach(async () => sandbox.restore());

  experiment('.getInvoiceAccountEntities', () => {
    let address, agent, contact, result;
    beforeEach(async () => {
      address = { addressId: uuid() };
      agent = { companyId: uuid() };
      contact = { contactId: uuid() };

      const payload = { address, agent, contact };
      result = await invoiceAccountsHelper.getInvoiceAccountEntities(payload);
    });

    test('validates the address', () => {
      expect(invoiceAccountsValidators.validateAddress.calledWith(
        address
      )).to.be.true();
    });

    test('validates the agent', () => {
      expect(invoiceAccountsValidators.validateAgentCompany.calledWith(
        agent
      )).to.be.true();
    });

    test('validates the contact', () => {
      expect(invoiceAccountsValidators.validateContact.calledWith(
        contact
      )).to.be.true();
    });

    experiment('when address exists', () => {
      test('the addressId is returned', () => {
        expect(result.address).to.equal(address);
      });

      test('a new address is not created', () => {
        expect(crmConnectors.addresses.createAddress.called).to.be.false();
      });
    });

    experiment('when new address data is passed in', () => {
      beforeEach(async () => {
        address = {
          address3: '53',
          address4: 'evergreen terrace',
          country: 'USA'
        };
        agent = { companyId: uuid() };
        contact = { contactId: uuid() };

        const payload = { address, agent, contact };
        result = await invoiceAccountsHelper.getInvoiceAccountEntities(payload);
      });

      test('a new address is created', () => {
        expect(crmConnectors.addresses.createAddress.calledWith(
          address
        )).to.be.true();
      });

      test('the new address is returned', () => {
        expect(result.address).to.equal(newAddress);
      });
    });

    experiment('when agent company exists', () => {
      test('the companyId is returned', () => {
        expect(result.agent).to.equal(agent);
      });

      test('a new company is not created', () => {
        expect(crmConnectors.companies.createCompany.called).to.be.false();
      });
    });

    experiment('when agent company does not exist', () => {
      beforeEach(async () => {
        address = { addressId: uuid() };
        contact = { contactId: uuid() };

        const payload = { address, contact };
        result = await invoiceAccountsHelper.getInvoiceAccountEntities(payload);
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
        address = { addressId: uuid() };
        agent = {
          type: 'individual',
          name: 'test-company'
        };
        contact = { contactId: uuid() };

        const payload = { address, agent, contact };
        result = await invoiceAccountsHelper.getInvoiceAccountEntities(payload);
      });

      test('a new company is created', () => {
        expect(crmConnectors.companies.createCompany.calledWith(
          agent
        )).to.be.true();
      });

      test('the new agent company is returned', () => {
        expect(result.agent).to.equal(newAgentCompany);
      });
    });

    experiment('when contact exists', () => {
      test('the contactId is returned', () => {
        expect(result.contact).to.equal(contact);
      });

      test('a new contact is not created', () => {
        expect(crmConnectors.contacts.createContact.called).to.be.false();
      });
    });

    experiment('when new contact data is passed in', () => {
      beforeEach(async () => {
        address = { addressId: uuid() };
        agent = { companyId: uuid() };
        contact = {
          type: 'person',
          firstName: 'Bob',
          lastName: 'Jones'
        };

        const payload = { address, agent, contact };
        result = await invoiceAccountsHelper.getInvoiceAccountEntities(payload);
      });

      test('a new contact is created', () => {
        expect(crmConnectors.contacts.createContact.calledWith(
          contact
        )).to.be.true();
      });

      test('the new contact is returned', () => {
        expect(result.contact).to.equal(newContact);
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

      result = await invoiceAccountsHelper.createInvoiceAccountAndRoles(request, null, address, contact);
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
