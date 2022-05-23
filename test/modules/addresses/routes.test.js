'use strict';

const Hapi = require('@hapi/hapi');
const { cloneDeep } = require('lodash');

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach, afterEach } = exports.lab = require('@hapi/lab').script();
const sandbox = require('sinon').createSandbox();

const routes = require('../../../src/modules/addresses/routes');
const controller = require('../../../src/modules/addresses/controller');

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

const createAddressRequest = () => ({
  method: 'POST',
  url: '/water/1.0/addresses',
  headers: {
    'defra-internal-user-id': 1234
  },
  payload: {
    address1: 'test-address-1',
    address2: 'test-address-2',
    address3: 'test-address-3',
    address4: 'test-address-4',
    town: 'test-town',
    county: 'test-county',
    country: 'test-country',
    postcode: 'test-postcode',
    isTest: true,
    dataSource: 'nald',
    uprn: 123456
  }
});

experiment('modules/addresses/routes', () => {
  afterEach(async () => {
    sandbox.restore();
  });

  experiment('postAddress', () => {
    let server, request;

    beforeEach(async () => {
      server = getServer(routes.postAddress);
      request = createAddressRequest();
    });

    test('the correct handler is specified', async () => {
      expect(routes.postAddress.handler)
        .to.equal(controller.postAddress);
    });

    test('address1 is optional', async () => {
      delete request.payload.address1;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('address2 is optional', async () => {
      delete request.payload.address2;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('address3 is optional', async () => {
      delete request.payload.address3;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('address4 is optional', async () => {
      delete request.payload.address4;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('town is optional', async () => {
      delete request.payload.town;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('county is optional', async () => {
      delete request.payload.county;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('requires country', async () => {
      delete request.payload.country;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('postcode is optional (but will be validate in the service layer)', async () => {
      delete request.payload.postcode;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('isTest is optional (but will default to false)', async () => {
      delete request.payload.isTest;
      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
      expect(response.request.payload.isTest).to.equal(false);
    });

    test('dataSource is optional (but will default to "wrls")', async () => {
      delete request.payload.dataSource;
      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
      expect(response.request.payload.dataSource).to.equal('wrls');
    });

    test('uprn is optional (will default to null)', async () => {
      delete request.payload.uprn;
      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
      expect(response.request.payload.uprn).to.equal(null);
    });

    test('returns a 400 if the calling user id is not supplied', async () => {
      request.headers = {};
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the calling user id is not a number', async () => {
      request.headers['defra-internal-user-id'] = 'a string';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });
});
