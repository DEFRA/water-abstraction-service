'use strict';

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const routes = require('../../../src/modules/charge-categories/routes');
const testHelpers = require('../../test-helpers');
const { omit } = require('lodash');

const makeRequest = (method, url) => ({
  method,
  url,
  auth: {
    strategy: 'basic',
    credentials: {
      scope: []
    }
  },
  headers: {
    'defra-internal-user-id': 123
  }
});

const makeGet = url => makeRequest('get', url);

experiment('modules/charge-categories/routes', () => {
  experiment('getChargeCategoryByProperties', () => {
    let request, server, queryParams;

    beforeEach(async () => {
      queryParams = {
        source: 'tidal',
        volume: 123,
        loss: 'high',
        isRestrictedSource: true,
        waterModel: 'tier 1'
      };
      server = await testHelpers.createServerForRoute(routes.getChargeCategoryByProperties, true);
      request = makeGet('/water/1.0/charge-categories');
    });

    test('returns the 200 for a valid payload', async () => {
      request.url = request.url + '?' + new URLSearchParams(queryParams);
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });
    test('returns the 200 for a volume of 0', async () => {
      queryParams.waterModel = 0;
      request.url = request.url + '?' + new URLSearchParams(queryParams);
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the source is not included in the query string', async () => {
      request.url = request.url + '?' + new URLSearchParams(omit(queryParams, 'source'));
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the source is not a valid option', async () => {
      queryParams.source = 'invalid';
      request.url = request.url + '?' + new URLSearchParams(queryParams);
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the loss is not included in the query string', async () => {
      request.url = request.url + '?' + new URLSearchParams(omit(queryParams, 'loss'));
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the loss is not a valid option', async () => {
      queryParams.loss = 'high loss';
      request.url = request.url + '?' + new URLSearchParams(queryParams);
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the isRestrictedSource is not included in the query string', async () => {
      request.url = request.url + '?' + new URLSearchParams(omit(queryParams, 'isRestrictedSource'));
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the isRestrictedSource is not boolean', async () => {
      queryParams.isRestrictedSource = 123;
      request.url = request.url + '?' + new URLSearchParams(queryParams);
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the waterModel is not included in the query string', async () => {
      request.url = request.url + '?' + new URLSearchParams(omit(queryParams, 'waterModel'));
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the waterModel is not a valid option', async () => {
      queryParams.waterModel = 'invalid';
      request.url = request.url + '?' + new URLSearchParams(queryParams);
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the volume is not included in the query string', async () => {
      request.url = request.url + '?' + new URLSearchParams(omit(queryParams, 'volume'));
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the volume is not a number', async () => {
      queryParams.waterModel = 'invalid';
      request.url = request.url + '?' + new URLSearchParams(queryParams);
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
    test('returns a 400 if the volume is a negative number', async () => {
      queryParams.waterModel = -1;
      request.url = request.url + '?' + new URLSearchParams(queryParams);
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });
});
