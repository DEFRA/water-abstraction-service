'use strict';

const {
  experiment,
  test,
  beforeEach
} = exports.lab = require('@hapi/lab').script();

const uuid = require('uuid/v4');
const { expect } = require('@hapi/code');

const routes = require('../../../../src/modules/charge-versions/routes/charge-version-workflows');
const testHelpers = require('../../../test-helpers');

const { ROLES: { chargeVersionWorkflowEditor, chargeVersionWorkflowReviewer } } = require('../../../../src/lib/roles');

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
const makePost = url => makeRequest('post', url);
const makePatch = url => makeRequest('patch', url);
const makeDelete = url => makeRequest('delete', url);

experiment('modules/charge-versions/routes/charge-version-workflows', () => {
  let server;
  let id;

  experiment('.getChargeVersionWorkflows', () => {
    let request;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.getChargeVersionWorkflows, true);
      request = makeGet('/water/1.0/charge-version-workflows');
    });

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.headers['defra-internal-user-id'] = 'invalid';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('.getChargeVersionWorkflow', () => {
    let request;

    beforeEach(async () => {
      id = uuid();
      server = await testHelpers.createServerForRoute(routes.getChargeVersionWorkflow, true);
      request = makeGet(`/water/1.0/charge-version-workflows/${id}`);
    });

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.headers['defra-internal-user-id'] = 'invalid';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('.postChargeVersionWorkflow', () => {
    let request;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.postChargeVersionWorkflow, true);

      request = makePost('/water/1.0/charge-version-workflows');
      request.payload = {
        licenceId: uuid(),
        chargeVersion: {
          dateRange: {
            startDate: '2019-01-01'
          }
        }
      };
    });

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.headers['defra-internal-user-id'] = 'invalid';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('http 400 bad request when the licence ID is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.payload.licenceId = 'not-a-guid';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('http 400 bad request when the charge version data is not an object', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.payload.chargeVersion = 'not-an-object';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('.patchChargeVersionWorkflow', () => {
    let request;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.patchChargeVersionWorkflow, true);

      id = uuid();
      request = makePatch(`/water/1.0/charge-version-workflows/${id}`);
      request.payload = {
        status: 'draft',
        approverComments: 'Good work'
      };
    });

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 422 unprocessable entity when the payload cannot be mapped', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.payload.chargeVersion = {
        status: 'not-a-valid-status'
      };
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(422);
    });

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.headers['defra-internal-user-id'] = 'invalid';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('http 400 bad request when the licence ID is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.payload.licenceId = 'not-a-guid';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });

    test('http 400 bad request when the charge version data is not an object', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.payload.chargeVersion = 'not-an-object';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });

  experiment('.deleteChargeVersionWorkflow', () => {
    let request;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.deleteChargeVersionWorkflow, true);

      id = uuid();
      request = makeDelete(`/water/1.0/charge-version-workflows/${id}`);
    });

    test('http 403 error when user has insufficient scope', async () => {
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(403);
    });

    test('http 200 OK when user has workflow editor scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowEditor];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 200 OK when user has workflow approver scope', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(200);
    });

    test('http 400 bad request when the defra-internal-user-id is invalid', async () => {
      request.auth.credentials.scope = [chargeVersionWorkflowReviewer];
      request.headers['defra-internal-user-id'] = 'invalid';
      const response = await server.inject(request);
      expect(response.statusCode).to.equal(400);
    });
  });
});
