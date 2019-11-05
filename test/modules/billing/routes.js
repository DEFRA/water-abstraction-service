'use strict';

const Hapi = require('@hapi/hapi');

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const routes = require('../../../src/modules/billing/routes');

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
  route.handler = (req, h) => h.response('Test handler').code(200);
  server.route(route);
  return server;
};

experiment('modules/billing/routes', () => {
  experiment('postCreateBatch', () => {
    let request;
    let server;

    beforeEach(async () => {
      server = getServer(routes.postCreateBatch);

      request = {
        method: 'POST',
        url: '/water/1.0/billing/batches',
        payload: {
          userEmail: 'charging@example.com',
          regionId: '054517f2-be00-4505-a3cc-df65a89cd8e1',
          batchType: 'annual',
          financialYear: 2019,
          season: 'summer'
        }
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the userEmail is not a valid email', async () => {
      request.payload.userEmail = 'a string';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the userEmail is ommited', async () => {
      delete request.payload.userEmail;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the regionId is not a uuid', async () => {
      request.payload.regionId = 'a string';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the regionId is ommited', async () => {
      delete request.payload.regionId;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the batchType is an unexpected value', async () => {
      request.payload.batchType = 'a string';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the batchType is ommited', async () => {
      delete request.payload.batchType;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the financialYear is not a number', async () => {
      request.payload.financialYear = false;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the financialYear is ommited', async () => {
      delete request.payload.financialYear;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the season is an unexpected value', async () => {
      request.payload.season = 'spring';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the season is ommited', async () => {
      delete request.payload.season;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });
});
