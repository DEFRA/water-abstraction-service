'use strict';

const { expect } = require('@hapi/code');
const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const sandbox = require('sinon').createSandbox();

const returnsConnector = require('../../../src/lib/connectors/returns');
const documentsConnector = require('../../../src/lib/connectors/crm/documents');
const companiesService = require('../../../src/lib/services/companies-service');

const invoiceAccountsService = require('../../../src/lib/services/invoice-accounts-service');

const { NotFoundError } = require('../../../src/lib/errors');
const controller = require('../../../src/modules/companies/controller');

const documents = [
  { system_external_id: 'licence_1' },
  { system_external_id: 'licence_2' }
];
const returns = [{
  return_id: 'return_1',
  licence_ref: 'licence_1',
  start_date: '2018-04-01',
  end_date: '2019-03-31',
  return_requirement: 'requirement_1',
  returns_frequency: 'day',
  status: 'due',
  metadata: {
    description: 'Site description',
    purposes: [
      {
        alias: 'Purpose alias 1',
        primary: { code: 'P', description: 'Primary Desc 1' },
        secondary: { code: 'S', description: 'Secondary Desc 1' },
        tertiary: { code: 'T', description: 'Tertiary Desc 1' }
      },
      {
        alias: 'Purpose alias 2',
        primary: { code: 'P', description: 'Primary Desc 2' },
        secondary: { code: 'S', description: 'Secondary Desc 2' },
        tertiary: { code: 'T', description: 'Tertiary Desc 2' }
      },
      {
        primary: { code: 'P', description: 'Primary Desc 3' },
        secondary: { code: 'S', description: 'Secondary Desc 3' },
        tertiary: { code: 'T', description: 'Tertiary Desc 3' }
      }
    ]
  }
}];

experiment('modules/companies/controller', () => {
  beforeEach(async () => {
    sandbox.stub(documentsConnector, 'findAll').resolves(documents);
    sandbox.stub(returnsConnector.returns, 'findAll').resolves(returns);

    sandbox.stub(companiesService, 'getCompany').resolves({ companyId: 'test-company-id' });
    sandbox.stub(companiesService, 'getCompanyAddresses').resolves([{ companyAddressId: 'test-company-address-id' }]);

    sandbox.stub(invoiceAccountsService, 'getInvoiceAccountEntities');
    sandbox.stub(invoiceAccountsService, 'createInvoiceAccount');
    sandbox.stub(invoiceAccountsService, 'createInvoiceAccountAddress');
    sandbox.stub(invoiceAccountsService, 'getNewEntities');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getReturns', () => {
    let request, response;
    beforeEach(async () => {
      request = {
        params: {
          entityId: 'company_1'
        },
        query: {
          startDate: '2018-04-01',
          endDate: '2019-03-31',
          isSummer: false,
          status: 'due'
        }
      };

      response = await controller.getReturns(request);
    });
    test('finds documents in CRM for specified company', async () => {
      expect(documentsConnector.findAll.calledWith({
        company_entity_id: 'company_1'
      })).to.equal(true);
    });

    test('requests the expected columns', async () => {
      const [, , columns] = returnsConnector.returns.findAll.lastCall.args;

      expect(columns).to.contain('return_id');
      expect(columns).to.contain('return_id');
      expect(columns).to.contain('licence_ref');
      expect(columns).to.contain('start_date');
      expect(columns).to.contain('end_date');
      expect(columns).to.contain('returns_frequency');
      expect(columns).to.contain('return_requirement');
      expect(columns).to.contain('status');
      expect(columns).to.contain('metadata');
    });

    test('finds returns matching documents', async () => {
      expect(returnsConnector.returns.findAll.calledWith({
        licence_ref: {
          $in: ['licence_1', 'licence_2']
        },
        'metadata->>isCurrent': 'true',
        'metadata->>isSummer': 'false',
        start_date: {
          $gte: '2018-04-01'
        },
        end_date: {
          $lte: '2019-03-31'
        },
        status: 'due'
      })).to.equal(true);
    });

    experiment('returns a response containing', () => {
      let returnValue;

      beforeEach(async () => {
        returnValue = response[0];
      });

      test('the licenceNumber', async () => {
        expect(returnValue.licenceNumber).to.equal('licence_1');
      });

      test('the returnId', async () => {
        expect(returnValue.returnId).to.equal('return_1');
      });

      test('the start date', async () => {
        expect(returnValue.startDate).to.equal('2018-04-01');
      });

      test('the end date', async () => {
        expect(returnValue.endDate).to.equal('2019-03-31');
      });

      test('the frequency', async () => {
        expect(returnValue.frequency).to.equal('day');
      });

      test('the return requirement', async () => {
        expect(returnValue.returnRequirement).to.equal('requirement_1');
      });

      test('the status', async () => {
        expect(returnValue.status).to.equal('due');
      });

      test('the site description', async () => {
        expect(returnValue.siteDescription).to.equal('Site description');
      });

      test('the purposes aliases or tertiary descriptions', async () => {
        expect(returnValue.purposes).to.equal([
          'Purpose alias 1',
          'Purpose alias 2',
          'Tertiary Desc 3'
        ]);
      });

      test('tolerates the absence of purposes', async () => {
        delete returns[0].metadata.purposes;
        const response = await controller.getReturns(request);
        expect(response[0].purposes).to.equal([]);
      });
    });
  });

  experiment('getCompany', () => {
    let request, result;
    beforeEach(async () => {
      request = {
        params: {
          companyId: 'test-company-id'
        }
      };

      result = await controller.getCompany(request);
    });

    test('calls the company connector with company id', () => {
      expect(companiesService.getCompany.calledWith(
        request.params.companyId
      )).to.be.true();
    });

    test('returns the output of the crm call', () => {
      expect(result).to.equal({ companyId: 'test-company-id' });
    });

    test('returns a Boom not found error if error is thrown', async () => {
      companiesService.getCompany.throws(new NotFoundError('oops!'));
      const err = await controller.getCompany(request);
      expect(err.isBoom).to.be.true();
      expect(err.output.statusCode).to.equal(404);
      expect(err.message).to.equal('oops!');
    });

    test('throws error if unexpected error is thrown', async () => {
      companiesService.getCompany.throws(new Error('oh no!'));
      try {
        await controller.getCompany(request);
      } catch (err) {
        expect(err.isBoom).to.be.undefined();
        expect(err.message).to.equal('oh no!');
      }
    });
  });

  experiment('getCompanyAddresses', () => {
    let request, result;
    beforeEach(async () => {
      request = {
        params: {
          companyId: 'test-company-id'
        }
      };

      result = await controller.getCompanyAddresses(request);
    });

    test('calls the company connector with company id', () => {
      expect(companiesService.getCompanyAddresses.calledWith(
        request.params.companyId
      )).to.be.true();
    });

    test('returns the output of the crm call', () => {
      expect(result).to.equal([{ companyAddressId: 'test-company-address-id' }]);
    });

    test('if no addresses are found, returns the output of the crm call', async () => {
      companiesService.getCompanyAddresses.resolves([]);
      result = await controller.getCompanyAddresses(request);
      expect(result).to.equal([]);
    });

    test('returns a Boom not found if error is thrown', async () => {
      companiesService.getCompanyAddresses.throws(new NotFoundError('oops!'));
      const err = await controller.getCompanyAddresses(request);
      expect(err.isBoom).to.be.true();
      expect(err.output.statusCode).to.equal(404);
      expect(err.message).to.equal('oops!');
    });
  });

  experiment('createCompanyInvoiceAccount', () => {
    let request, result, address, agent, contact, invoiceAccount;
    beforeEach(async () => {
      address = { addressId: 'new-address' };
      agent = { companyId: 'new-agent-company' };
      contact = { contactId: 'new-contact' };
      invoiceAccount = { invoiceAccountId: 'new-invoice-account' };
      invoiceAccountsService.getInvoiceAccountEntities.resolves({ address, agent, contact });
      invoiceAccountsService.createInvoiceAccount.resolves(invoiceAccount);
      invoiceAccountsService.createInvoiceAccountAddress.resolves();
      invoiceAccountsService.getNewEntities.resolves({ invoiceAccount, contact });

      request = {
        params: {
          companyId: 'test-company-id'
        },
        payload: {
          regionId: 'test-region-id',
          startDate: '2020-04-01',
          address: { addressId: 'test-address-id' },
          contact: { contactId: 'test-contact-id' }
        }
      };
      result = await controller.createCompanyInvoiceAccount(request);
    });

    test('calls getInvoiceAccountEntities helper function with request', () => {
      expect(invoiceAccountsService.getInvoiceAccountEntities.calledWith(
        request
      )).to.be.true();
    });

    test('calls the createInvoiceAccount helper function with correct params', () => {
      expect(invoiceAccountsService.createInvoiceAccount.calledWith(
        request
      )).to.be.true();
    });

    test('calls the createInvoiceAccountAddress helper function with correct params', () => {
      expect(invoiceAccountsService.createInvoiceAccountAddress.calledWith(
        request,
        invoiceAccount,
        address,
        agent,
        contact
      )).to.be.true();
    });

    test('calls the getNewEntities helper function with correct params', () => {
      expect(invoiceAccountsService.getNewEntities.calledWith(
        invoiceAccount,
        address,
        agent,
        contact
      )).to.be.true();
    });

    test('returns the return value from the getNewEntities helper function', () => {
      expect(result).to.equal({ invoiceAccount, contact });
    });

    test('returns  a Boom not found error if error is thrown', async () => {
      invoiceAccountsService.createInvoiceAccount.throws(new NotFoundError('oops!'));
      const err = await controller.createCompanyInvoiceAccount(request);
      expect(err.isBoom).to.be.true();
      expect(err.output.statusCode).to.equal(404);
      expect(err.message).to.equal('oops!');
    });
  });
});
