'use strict';

const Hapi = require('@hapi/hapi');
const uuid = require('uuid/v4');
const { cloneDeep } = require('lodash');

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const routes = require('../../../src/modules/companies/routes');
const testHelpers = require('../../test-helpers');
const { CONTACT_TYPES } = require('../../../src/lib/models/contact-v2');
const { ORGANISATION_TYPES } = require('../../../src/lib/models/company');

/**
 * Creates a test Hapi server that has no other plugins loaded,
 * does not require auth and will rewrite the handler function to
 * return a test stub.
 *
 * This allows the route validation to be tested in isolation.
 *
 * @param {Object} route The route to test
 */
const getServer = route => {
  const server = Hapi.server({ port: 80 });

  const testRoute = cloneDeep(route);
  testRoute.handler = (req, h) => h.response('Test handler').code(200);
  testRoute.config.pre = [];
  server.route(testRoute);
  return server;
};

experiment('modules/companies/routes', () => {
  experiment('getCompany', () => {
    const companyId = uuid();
    let request;
    let server;

    beforeEach(async () => {
      server = getServer(routes.getCompany);
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
      server = getServer(routes.searchCompaniesByName);
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
      server = getServer(routes.getCompanyAddresses);
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
      server = getServer(routes.createCompanyInvoiceAccount);

      request = {
        method: 'POST',
        url: `/water/1.0/companies/${companyId}/invoice-accounts`,
        payload: {
          startDate: '2020-04-01',
          regionId: uuid(),
          address: { addressId: uuid() },
          agent: { companyId: uuid() },
          contact: { contactId: uuid() }
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

    experiment('address -', () => {
      test('returns a 200 if it contains an addressId', async () => {
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });

      test('returns a 400 if it is an unexpected value', async () => {
        request.payload.address = 'a string';
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      test('returns a 400 if it is omitted', async () => {
        delete request.payload.address;
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      test('returns a 200 if it contains data', async () => {
        request.payload.address = {
          addressLine2: '11',
          addressLine4: 'Test Lane',
          postcode: 'T1 1TT',
          country: 'UK'
        };
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });
    });

    experiment('agent -', () => {
      test('returns a 200 if is omitted', async () => {
        delete request.payload.agent;
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });

      test('returns a 200 if it is null', async () => {
        request.payload.agent = null;
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });

      test('returns a 400 if it is an unexpected value', async () => {
        request.payload.agent = 'a string';
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      Object.values(ORGANISATION_TYPES).forEach(type => {
        test(`returns a 200 when type is ${type}`, async () => {
          request.payload.agent = {
            type,
            name: 'Agent company'
          };
          const response = await server.inject(request);
          expect(response.statusCode).to.equal(200);
        });
      });

      test('returns a 400 if type is an unexpected value', async () => {
        request.payload.agent = {
          type: 'Agent company'
        };
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      test('returns a 200 if the company number is omitted', async () => {
        request.payload.agent = {
          type: 'limitedCompany',
          name: 'Agent company'
        };
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });
    });

    experiment('contact -', () => {
      test('returns a 200 if it only contains a contactId', async () => {
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });

      test('returns a 200 if it is omitted', async () => {
        delete request.payload.contact;
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });

      test('returns a 200 if it is null', async () => {
        request.payload.contact = null;
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(200);
      });

      test('returns a 400 if it is an unexpected value', async () => {
        request.payload.contact = 'a string';
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      Object.values(CONTACT_TYPES).forEach(type => {
        test(`returns a 200 when type is ${type}`, async () => {
          request.payload.contact = {
            type
          };
          const response = await server.inject(request);
          expect(response.statusCode).to.equal(200);
        });
      });

      test('returns a 400 if type is an unexpected value', async () => {
        request.payload.contact = {
          type: 'human',
          title: 'Sir',
          firstName: 'Johnny',
          lastName: 'Test'
        };
        const response = await server.inject(request);
        expect(response.statusCode).to.equal(400);
      });

      test('returns a 200 if contains data', async () => {
        request.payload.contact = {
          type: 'person',
          title: 'Sir',
          firstName: 'Johnny',
          lastName: 'Test',
          department: 'accounts payable'
        };
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
