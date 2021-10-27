'use strict';
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();
const { expect } = require('@hapi/code');
const uuid = require('uuid/v4');
const testHelpers = require('../../../test-helpers');

const routes = require('../../../../src/modules/billing/routes/two-part-tariff-review');
const preHandlers = require('../../../../src/modules/billing/pre-handlers');
const { ROLES } = require('../../../../src/lib/roles');

/**
 * Creates a test Hapi server that has no other plugins loaded,
 * does not require auth and will rewrite the handler function to
 * return a test stub.
 *
 * This allows the route validation to be tested in isolation.
 *
 * @param {Object} route The route to test
 */
const getServer = route =>
  testHelpers.createServerForRoute(route, true);

experiment('modules/billing/routes/two-part-tariff-review', () => {
  let auth;

  beforeEach(async () => {
    auth = {
      strategy: 'basic',
      credentials: {
        scope: [ROLES.billing]
      }
    };
  });

  experiment('deleteBatchLicenceBillingVolumes', () => {
    let request, server, batchId, licenceId, financialYearEnding;

    beforeEach(async () => {
      server = await getServer(routes.deleteBatchLicenceBillingVolumes);
      batchId = uuid();
      licenceId = uuid();
      financialYearEnding = 2020;

      request = {
        method: 'DELETE',
        url: `/water/1.0/billing/batches/${batchId}/licences/${licenceId}/financial-year-ending/${financialYearEnding}`,
        headers: {},
        auth
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 200 if unknown headers are passed', async () => {
      request.headers['x-custom-header'] = '123';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the batch id is not a uuid', async () => {
      request.url = request.url.replace(batchId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the licence id is not a uuid', async () => {
      request.url = request.url.replace(licenceId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the financialyearending is not a number', async () => {
      request.url = request.url.replace(financialYearEnding, 'crumpets');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 403 if the request has insufficient scope', async () => {
      request.auth.credentials.scope = [];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('returns a 200 when params are acceptable', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });
  });

  experiment('patchBillingVolume', () => {
    let request, server, billingVolumeId;

    beforeEach(async () => {
      server = await getServer(routes.patchBillingVolume);
      billingVolumeId = '054517f2-be00-4505-a3cc-df65a89cd8e1';

      request = {
        method: 'PATCH',
        url: `/water/1.0/billing/volumes/${billingVolumeId}`,
        payload: {
          volume: 5
        },
        headers: {},
        auth
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 200 if unknown headers are passed', async () => {
      request.headers['x-custom-header'] = '123';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the billingVolumeId is not a uuid', async () => {
      request.url = request.url.replace(billingVolumeId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 403 if the request has insufficient scope', async () => {
      request.auth.credentials.scope = [];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('returns a 200 if the volume is 0', async () => {
      request.payload.volume = 0;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the volume is not a positive number', async () => {
      request.payload.volume = -5;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the volume is omitted', async () => {
      delete request.payload.volume;
    });
  });

  experiment('getBatchLicences', () => {
    let request;
    let server;
    let validBatchId;

    beforeEach(async () => {
      server = await getServer(routes.getBatchLicences);
      validBatchId = uuid();

      request = {
        method: 'GET',
        url: `/water/1.0/billing/batches/${validBatchId}/licences`,
        headers: {},
        auth
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the batch id is not a uuid', async () => {
      request.url = request.url.replace(validBatchId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('contains a pre handler to load the batch', async () => {
      const { pre } = routes.getBatchLicences.config;
      expect(pre).to.have.length(1);
      expect(pre[0].method).to.equal(preHandlers.loadBatch);
      expect(pre[0].assign).to.equal('batch');
    });
  });
});
