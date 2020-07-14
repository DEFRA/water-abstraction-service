'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const routes = require('../../../src/modules/companies/routes');
const testHelpers = require('../../test-helpers');

experiment('modules/companies/routes', () => {
  experiment('getCompanyContacts', () => {
    let server;

    beforeEach(async () => {
      server = testHelpers.createServerForRoute(routes.getCompanyContacts);
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
