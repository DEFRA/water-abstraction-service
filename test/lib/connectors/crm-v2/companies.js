'use strict';

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

const companyConnector = require('../../../../src/lib/connectors/crm-v2/companies');
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

experiment('lib/connectors/crm-v2/companies', () => {
  beforeEach(async () => {
    sandbox.stub(config.services, 'crm_v2').value('http://test.defra');
    sandbox.stub(serviceRequest, 'get');
    sandbox.stub(serviceRequest, 'post');
    sandbox.stub(serviceRequest, 'delete');
  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.getCompany', () => {
    let response;

    beforeEach(async () => {
      serviceRequest.get.resolves({
        companyId: 'test-company-id'
      });

      response = await companyConnector.getCompany('test-company-id');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/companies/test-company-id');
    });

    test('returns the result from the crm', async () => {
      expect(response).to.equal({
        companyId: 'test-company-id'
      });
    });
  });

  experiment('.createCompany', () => {
    let company;
    let companyId;
    let result;

    beforeEach(async () => {
      companyId = uuid();
      company = { companyId };

      serviceRequest.post.resolves(company);
      result = await companyConnector.createCompany(company);
    });

    test('makes a post to the expected URL', async () => {
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal('http://test.defra/companies');
    });

    test('passes the company to the post', async () => {
      const [, options] = serviceRequest.post.lastCall.args;
      expect(options).to.equal({ body: company });
    });

    test('returns the entity from the CRM', async () => {
      expect(result).to.equal(company);
    });
  });

  experiment('.deleteCompany', () => {
    beforeEach(async () => {
      serviceRequest.delete.resolves();

      await companyConnector.deleteCompany('test-company-id');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal('http://test.defra/companies/test-company-id');
    });
  });

  experiment('.searchCompaniesByName', () => {
    let response;
    const expectedOutput = [
      {
        companyId: '8bec1b99-255a-4238-b538-9c2d5e7a7aab',
        name: 'Joe Water',
        type: 'person'
      }
    ];

    beforeEach(async () => {
      serviceRequest.get.resolves(expectedOutput);

      response = await companyConnector.searchCompaniesByName('Joe Water');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/companies/search');
    });

    test('returns the result from the crm', async () => {
      expect(response).to.equal(expectedOutput);
    });
  });

  experiment('.getCompanyAddresses', () => {
    let response;

    beforeEach(async () => {
      serviceRequest.get.resolves([{
        companyAddressId: 'test-company-address-id'
      }]);

      response = await companyConnector.getCompanyAddresses('test-company-id');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/companies/test-company-id/addresses');
    });

    test('returns the result from the crm', async () => {
      expect(response).to.equal([{
        companyAddressId: 'test-company-address-id'
      }]);
    });
  });

  experiment('.createCompanyAddress', () => {
    let companyAddress;
    let companyAddressId;
    let addressId;
    let companyId;
    let result;

    beforeEach(async () => {
      addressId = uuid();
      companyId = uuid();
      companyAddressId = uuid();
      companyAddress = { addressId };

      serviceRequest.post.resolves({ companyAddressId, ...companyAddress });
      result = await companyConnector.createCompanyAddress(companyId, companyAddress);
    });

    test('makes a post to the expected URL', async () => {
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(`http://test.defra/companies/${companyId}/addresses`);
    });

    test('passes the company address data to the post', async () => {
      const [, options] = serviceRequest.post.lastCall.args;
      expect(options).to.equal({ body: companyAddress });
    });

    test('returns the entity from the CRM', async () => {
      expect(result).to.equal({
        companyAddressId,
        ...companyAddress
      });
    });
  });

  experiment('.deleteCompanyAddress', () => {
    beforeEach(async () => {
      serviceRequest.delete.resolves();

      await companyConnector.deleteCompanyAddress('test-company-id', 'test-company-address-id');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal('http://test.defra/companies/test-company-id/addresses/test-company-address-id');
    });
  });

  experiment('.createCompanyContact', () => {
    let companyContact;
    let companyContactId;
    let contactId;
    let companyId;
    let result;

    beforeEach(async () => {
      contactId = uuid();
      companyId = uuid();
      companyContactId = uuid();
      companyContact = { contactId };

      serviceRequest.post.resolves({ companyContactId, ...companyContact });
      result = await companyConnector.createCompanyContact(companyId, companyContact);
    });

    test('makes a post to the expected URL', async () => {
      const [url] = serviceRequest.post.lastCall.args;
      expect(url).to.equal(`http://test.defra/companies/${companyId}/contacts`);
    });

    test('passes the company address data to the post', async () => {
      const [, options] = serviceRequest.post.lastCall.args;
      expect(options).to.equal({ body: companyContact });
    });

    test('returns the entity from the CRM', async () => {
      expect(result).to.equal({
        companyContactId,
        ...companyContact
      });
    });
  });

  experiment('.deleteCompanyContact', () => {
    beforeEach(async () => {
      serviceRequest.delete.resolves();

      await companyConnector.deleteCompanyContact('test-company-id', 'test-company-contact-id');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.delete.lastCall.args;
      expect(url).to.equal('http://test.defra/companies/test-company-id/contacts/test-company-contact-id');
    });
  });

  experiment('.getCompanyContacts', () => {
    let response;
    let testResponse;

    beforeEach(async () => {
      testResponse = [
        { companyContactId: '1' },
        { companyContactId: '2' },
        { companyContactId: '3' }

      ];
      serviceRequest.get.resolves(testResponse);

      response = await companyConnector.getCompanyContacts('test-company-id');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/companies/test-company-id/contacts');
    });

    test('returns the result from the crm', async () => {
      expect(response).to.equal(testResponse);
    });
  });

  experiment('.getCompanyLicences', () => {
    beforeEach(async () => {
      serviceRequest.get.resolves([]);

      await companyConnector.getCompanyLicences('test-company-id');
    });

    test('makes a request to the expected URL', async () => {
      const [url] = serviceRequest.get.lastCall.args;
      expect(url).to.equal('http://test.defra/companies/test-company-id/licences');
    });
  });
});
