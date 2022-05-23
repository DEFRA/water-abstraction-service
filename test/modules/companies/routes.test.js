'use strict';

const uuid = require('uuid/v4');

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const routes = require('../../../src/modules/companies/routes');
const testHelpers = require('../../test-helpers');
const { ROLES: { billing } } = require('../../../src/lib/roles');

experiment('modules/companies/routes', () => {
  experiment('getCompany', () => {
    const companyId = uuid();
    let request;
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getCompany);
      request = {
        method: 'GET',
        url: `/water/1.0/companies/${companyId}`
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the company id is not a uuid', async () => {
      request.url = request.url.replace(companyId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('searchCompaniesByName', () => {
    let server, request;
    const inputName = 'test';
    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.searchCompaniesByName);
      request = {
        method: 'GET',
        url: `/water/1.0/companies/search?name=${inputName}`
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the search string is less than two characters long', async () => {
      request.url = '/water/1.0/companies/search?name=a';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('getCompanyAddresses', () => {
    const companyId = uuid();
    let request;
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getCompanyAddresses);
      request = {
        method: 'GET',
        url: `/water/1.0/companies/${companyId}/addresses`
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the company id is not a uuid', async () => {
      request.url = request.url.replace(companyId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('createCompanyInvoiceAccount', () => {
    const companyId = uuid();
    let request;
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.createCompanyInvoiceAccount, true);

      request = {
        method: 'POST',
        url: `/water/1.0/companies/${companyId}/invoice-accounts`,
        payload: {
          startDate: '2020-04-01',
          regionId: uuid()
        },
        auth: {
          strategy: 'basic',
          credentials: {
            scope: [billing]
          }
        }
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the company id is not a uuid', async () => {
      request.url = request.url.replace(companyId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    experiment('startDate -', () => {
      test('returns a 400 if it is omitted', async () => {
        delete request.payload.startDate;
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      test('returns a 400 if it is an invalid date', async () => {
        request.payload.startDate = '2020-01-35';
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      test('returns a 400 if it is not a date', async () => {
        request.payload.startDate = 'a string';
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });
    });

    experiment('regionId -', () => {
      test('returns a 400 if it is not a uuid', async () => {
        request.payload.regionId = 'a string';
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      test('returns a 400 if it is omitted', async () => {
        delete request.payload.regionId;
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });
    });
  });

  experiment('getCompanyContacts', () => {
    let server;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getCompanyContacts);
    });

    test('returns a 400 response if the company id is not a uuid', async () => {
      const request = {
        method: 'GET',
        url: '/water/1.0/companies/1234/contacts'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('accepts a valid uuid for the company id', async () => {
      const request = {
        method: 'GET',
        url: '/water/1.0/companies/ffffe5d7-b2d4-4f88-b2f5-d0b497bc276f/contacts'
      };

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });
  });
});
