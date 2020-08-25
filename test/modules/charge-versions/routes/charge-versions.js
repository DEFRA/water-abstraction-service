'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');

const routes = require('../../../../src/modules/charge-versions/routes/charge-versions');
const testHelpers = require('../../../test-helpers');

const makeGet = url => ({ method: 'GET', url });

experiment('modules/charge-versions/routes/charge-versions', () => {
  let server;
  let id;

  experiment('.getDefaultChargesForLicenceVersion', () => {
    beforeEach(async () => {
      id = uuid();
      server = await testHelpers.createServerForRoute(routes.getDefaultChargesForLicenceVersion);
    });

    test('accepts a uuid for the licence version id', async () => {
      const request = makeGet(`/water/1.0/charge-versions/default/${id}`);
      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
    });

    test('returns a bad request code if the licence version id is not a uuid', async () => {
      const request = makeGet('/water/1.0/charge-versions/default/123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('.getChargeVersion', () => {
    beforeEach(async () => {
      id = uuid();
      server = await testHelpers.createServerForRoute(routes.getChargeVersion);
    });

    test('accepts a uuid for the charge version id', async () => {
      const request = makeGet(`/water/1.0/charge-versions/${id}`);
      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
    });

    test('returns a bad request code if the charge version id is not a uuid', async () => {
      const request = makeGet('/water/1.0/charge-versions/123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });
});
