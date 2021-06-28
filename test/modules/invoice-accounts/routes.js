'use strict';

const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');

const {
  beforeEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const testHelpers = require('../../test-helpers');
const routes = require('../../../src/modules/invoice-accounts/routes');
const { ROLES: { manageBillingAccounts } } = require('../../../src/lib/roles');

experiment('modules/invoice-accounts/routes', () => {
  let server;
  experiment('.getInvoiceAccount', () => {
    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getInvoiceAccount);
    });

    test('validates the  id must be a uuid', async () => {
      const url = '/water/1.0/invoice-accounts/not-a-valid-id';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the licence id', async () => {
      const url = `/water/1.0/invoice-accounts/${uuid()}`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('.postInvoiceAccountAddress', () => {
    let request;

    const address = {
      addressLine1: 'Test Farm',
      addressLine2: 'Test Lane',
      addressLine3: 'Test Forest',
      addressLine4: 'Little Testington',
      town: 'Testington',
      county: 'Testingshire',
      postcode: 'TT1 1TT',
      country: 'United Kingdom'
    };

    beforeEach(async () => {
      request = {
        method: 'post',
        payload: {
          address,
          agentCompany: null,
          contact: null
        },
        auth: {
          strategy: 'basic',
          credentials: {
            scope: [manageBillingAccounts]
          }
        },
        url: `/water/1.0/invoice-accounts/${uuid()}/addresses`
      };
      server = await testHelpers.createServerForRoute(routes.postInvoiceAccountAddress, true);
    });

    test('gives a 200 error when the request is valid', async () => {
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(200);
    });

    test('gives a 403 error when the request does not have "billing" scope', async () => {
      request.auth.credentials.scope = [];
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(403);
    });

    test('gives a 400 error when the invoice account ID is invalid', async () => {
      request.url = '/water/1.0/invoice-accounts/not-a-guid/addresses';
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(400);
    });

    test('gives a 400 error when the address is invalid', async () => {
      request.payload.address.addressLine5 = 'Asparagus Patch';
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(400);
    });

    test('gives a 400 error when the contact is invalid', async () => {
      request.payload.contact = { nickname: 'Skipper' };
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(400);
    });

    test('gives a 400 error when the agentCompany is invalid', async () => {
      request.payload.agentCompany = { numberOfEmployees: 25 };
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(400);
    });
  });

  experiment('.getLicences', () => {
    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getLicences);
    });

    test('validates the id must be a uuid', async () => {
      const url = '/water/1.0/invoice-accounts/not-a-valid-id/licences';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the invoice account id', async () => {
      const url = `/water/1.0/invoice-accounts/${uuid()}/licences`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });

  experiment('.getInvoices', () => {
    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getInvoices);
    });

    test('validates the  id must be a uuid', async () => {
      const url = '/water/1.0/invoice-accounts/not-a-valid-id/invoices';
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(400);
    });

    test('allows a valid uuid for the invoice account id', async () => {
      const url = `/water/1.0/invoice-accounts/${uuid()}/invoices`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });

    test('allows a page query to be supplied', async () => {
      const url = `/water/1.0/invoice-accounts/${uuid()}/invoices?page=2`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });

    test('allows a perPage query to be supplied', async () => {
      const url = `/water/1.0/invoice-accounts/${uuid()}/invoices?perPage=5`;
      const output = await server.inject(url);
      expect(output.statusCode).to.equal(200);
    });
  });
});
