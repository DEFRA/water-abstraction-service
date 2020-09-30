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
});
