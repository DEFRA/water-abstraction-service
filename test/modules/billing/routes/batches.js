'use strict';
const uuid = require('uuid/v4');

const { expect } = require('@hapi/code');
const { experiment, test, beforeEach } = exports.lab = require('@hapi/lab').script();

const routes = require('../../../../src/modules/billing/routes/batches');
const preHandlers = require('../../../../src/modules/billing/pre-handlers');
const testHelpers = require('../../../test-helpers');
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

experiment('modules/billing/routes', () => {
  let auth;

  beforeEach(async () => {
    auth = {
      strategy: 'basic',
      credentials: {
        scope: [ROLES.billing]
      }
    };
  });

  experiment('postCreateBatch', () => {
    let request;
    let server;

    beforeEach(async () => {
      server = await getServer(routes.postCreateBatch);

      request = {
        method: 'POST',
        url: '/water/1.0/billing/batches',
        payload: {
          userEmail: 'charging@example.com',
          regionId: '054517f2-be00-4505-a3cc-df65a89cd8e1',
          batchType: 'annual',
          financialYearEnding: 2019,
          isSummer: true
        },
        auth
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

    test('returns a 400 if the userEmail is omitted', async () => {
      delete request.payload.userEmail;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the regionId is not a uuid', async () => {
      request.payload.regionId = 'a string';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the regionId is omitted', async () => {
      delete request.payload.regionId;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the batchType is an unexpected value', async () => {
      request.payload.batchType = 'a string';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the batchType is omitted', async () => {
      delete request.payload.batchType;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the financialYear is not a number', async () => {
      request.payload.financialYearEnding = false;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the financialYear is omitted', async () => {
      delete request.payload.financialYearEnding;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the isSummer is an unexpected value', async () => {
      request.payload.isSummer = 'nope';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 200 if the isSummer is omitted (defaults to false)', async () => {
      delete request.payload.isSummer;

      const response = await server.inject(request);

      expect(response.statusCode).to.equal(200);
      expect(response.request.payload.isSummer).to.equal(false);
    });
  });

  experiment('getBatch', () => {
    let request;
    let server;
    let validId;

    beforeEach(async () => {
      server = await getServer(routes.getBatch, true);
      validId = '00000000-0000-0000-0000-000000000000';
      request = {
        method: 'GET',
        url: `/water/1.0/billing/batches/${validId}`,
        auth
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the batch id is not a uuid', async () => {
      request.url = request.url.replace(validId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('contains a pre handler to load the batch', async () => {
      const { pre } = routes.getBatch.config;
      expect(pre).to.have.length(1);
      expect(pre[0].method).to.equal(preHandlers.loadBatch);
      expect(pre[0].assign).to.equal('batch');
    });
  });

  experiment('getBatches', () => {
    let request;
    let server;

    beforeEach(async () => {
      server = await getServer(routes.getBatches);

      request = {
        method: 'GET',
        url: '/water/1.0/billing/batches',
        auth
      };
    });

    test('returns 200 with no query params payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns 200 when pagination params are added to the query string', async () => {
      request.url += '?page=1&perPage=10';

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the page is not an integer', async () => {
      request.url += '?page=___one___&perPage=10';

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the perPage param is not an integer', async () => {
      request.url += '?page=1&perPage=___ten___';

      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('getBatchInvoices', () => {
    let request;
    let server;
    let validId;

    beforeEach(async () => {
      server = await getServer(routes.getBatchInvoices);
      validId = '00000000-0000-0000-0000-000000000000';
      request = {
        method: 'GET',
        url: `/water/1.0/billing/batches/${validId}/invoices`,
        auth
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the batch id is not a uuid', async () => {
      request.url = request.url.replace(validId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('getBatchInvoiceDetail', () => {
    let request;
    let server;
    let validInvoiceId;
    let validBatchId;

    beforeEach(async () => {
      server = await getServer(routes.getBatchInvoiceDetail);
      validInvoiceId = uuid();
      validBatchId = uuid();

      request = {
        method: 'GET',
        url: `/water/1.0/billing/batches/${validBatchId}/invoices/${validInvoiceId}`,
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

    test('returns a 400 if the invoice id is not a uuid', async () => {
      request.url = request.url.replace(validInvoiceId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('getBatchInvoicesDetail', () => {
    let request;
    let server;
    let validBatchId;

    beforeEach(async () => {
      server = await getServer(routes.getBatchInvoicesDetails);
      validBatchId = uuid();

      request = {
        method: 'GET',
        url: `/water/1.0/billing/batches/${validBatchId}/invoices/details`,
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
  });

  experiment('deleteBatchInvoice', () => {
    let request;
    let server;
    let validBatchId;
    let validInvoiceId;
    beforeEach(async () => {
      server = await getServer(routes.deleteBatchInvoice);
      validBatchId = uuid();
      validInvoiceId = uuid();

      request = {
        method: 'DELETE',
        url: `/water/1.0/billing/batches/${validBatchId}/invoices/${validInvoiceId}`,
        auth
      };
    });

    test('returns the 200 for a valid payload without rebilling invoice id', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns the 200 for a valid payload with rebilling invoice id', async () => {
      request.url = request.url + `?originalInvoiceId=${uuid()}&rebillInvoiceId=${uuid()}`;
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the batch id is not a uuid', async () => {
      request.url = request.url.replace(validBatchId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the invoice id is not a uuid', async () => {
      request.url = request.url.replace(validInvoiceId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the original invoice id is not a uuid', async () => {
      request.url = request.url + '?originalInvoiceId=123';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 if the original invoice id is not a uuid', async () => {
      request.url = request.url + '?rebillInvoiceId=123';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('contains a pre handler to load the batch', async () => {
      const { pre } = routes.deleteBatchInvoice.config;
      expect(pre).to.have.length(1);
      expect(pre[0].method).to.equal(preHandlers.loadBatch);
      expect(pre[0].assign).to.equal('batch');
    });
  });

  experiment('deleteBatch', () => {
    let request;
    let server;
    let validBatchId;

    beforeEach(async () => {
      server = await getServer(routes.deleteBatch);
      validBatchId = uuid();

      request = {
        method: 'DELETE',
        url: `/water/1.0/billing/batches/${validBatchId}`,
        auth,
        headers: {}
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
      request.url = request.url.replace(validBatchId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 403 if the calling user has insufficent scope', async () => {
      request.auth.credentials.scope = [];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('contains a pre handler to load the batch', async () => {
      const { pre } = routes.deleteBatch.config;
      expect(pre).to.have.length(1);
      expect(pre[0].method).to.equal(preHandlers.loadBatch);
      expect(pre[0].assign).to.equal('batch');
    });
  });

  experiment('postApproveBatch', () => {
    let request;
    let server;
    let validBatchId;

    beforeEach(async () => {
      server = await getServer(routes.postApproveBatch);
      validBatchId = uuid();

      request = {
        method: 'POST',
        url: `/water/1.0/billing/batches/${validBatchId}/approve`,
        auth,
        headers: {}
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
      request.url = request.url.replace(validBatchId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 403 if the request has insufficient scope', async () => {
      request.auth.credentials.scope = [];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('contains a pre handler to load the batch', async () => {
      const { pre } = routes.postApproveBatch.config;
      expect(pre).to.have.length(1);
      expect(pre[0].method).to.equal(preHandlers.loadBatch);
      expect(pre[0].assign).to.equal('batch');
    });
  });

  experiment('getInvoiceLicence', () => {
    let request;
    let server;
    let invoiceLicenceId;

    beforeEach(async () => {
      server = await getServer(routes.getInvoiceLicence);
      invoiceLicenceId = uuid();

      request = {
        method: 'GET',
        url: `/water/1.0/billing/invoice-licences/${invoiceLicenceId}`,
        auth
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the invoice licence id is not a uuid', async () => {
      request.url = request.url.replace(invoiceLicenceId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('.postApproveReviewBatch', () => {
    let request;
    let server;
    let validBatchId;

    beforeEach(async () => {
      server = await getServer(routes.postApproveReviewBatch, true);
      validBatchId = uuid();

      request = {
        method: 'POST',
        url: `/water/1.0/billing/batches/${validBatchId}/approve-review`,
        headers: {
        },
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
      const { pre } = routes.postApproveBatch.config;
      expect(pre).to.have.length(1);
      expect(pre[0].method).to.equal(preHandlers.loadBatch);
      expect(pre[0].assign).to.equal('batch');
    });
  });

  experiment('getBatchDownloadData', () => {
    let request;
    let server;
    let validId;

    beforeEach(async () => {
      server = await getServer(routes.getBatchDownloadData, true);
      validId = '00000000-0000-0000-0000-000000000000';
      request = {
        method: 'GET',
        url: `/water/1.0/billing/batches/${validId}/download-data`,
        auth
      };
    });

    test('returns the 200 for a valid payload', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('returns a 400 if the batch id is not a uuid', async () => {
      request.url = request.url.replace(validId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('contains a pre handler to load the batch', async () => {
      const { pre } = routes.getBatch.config;
      expect(pre).to.have.length(1);
      expect(pre[0].method).to.equal(preHandlers.loadBatch);
      expect(pre[0].assign).to.equal('batch');
    });
  });

  experiment('postSetBatchStatusToCancel', () => {
    let request;
    let server;
    let validBatchId;

    beforeEach(async () => {
      server = await getServer(routes.postSetBatchStatusToCancel);
      validBatchId = uuid();

      request = {
        method: 'POST',
        url: `/water/1.0/billing/batches/${validBatchId}/status/cancel`,
        auth,
        headers: {}
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
      request.url = request.url.replace(validBatchId, '123');
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('returns a 403 if the calling user has insufficent scope', async () => {
      request.auth.credentials.scope = [];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('contains a pre handler to load the batch', async () => {
      const { pre } = routes.postSetBatchStatusToCancel.config;
      expect(pre).to.have.length(1);
      expect(pre[0].method).to.equal(preHandlers.loadBatch);
      expect(pre[0].assign).to.equal('batch');
    });
  });
});
