'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const routes = require('../../../src/modules/charge-versions/routes');
const testHelpers = require('../../test-helpers');

const makeGet = url => ({ method: 'GET', url });

experiment('modules/charge-versions/routes', () => {
  experiment('.getDefaultChargesForLicenceVersion', () => {
    let server;
    let uuid;

    beforeEach(async () => {
      uuid = '62e87677-0e02-4006-8adb-4347125f2a12';
      server = testHelpers.createServerForRoute(routes.getDefaultChargesForLicenceVersion);
    });

    test('accepts a uuid for the licence version id', async () => {
      const request = makeGet(`/water/1.0/charge-versions/default/${uuid}`);
      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
    });

    test('returns a bad request code if the licence version id is not a uuid', async () => {
      const request = makeGet('/water/1.0/charge-versions/default/123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });
});
