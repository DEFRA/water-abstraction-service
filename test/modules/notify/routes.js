const {
  beforeEach,
  afterEach,
  experiment,
  test
} = exports.lab = require('@hapi/lab').script();

const { expect } = require('@hapi/code');

const uuid = require('uuid/v4');

const sandbox = require('sinon').createSandbox();

const testHelpers = require('../../test-helpers');
const routes = require('../../../src/modules/notify/routes');
const controller = require('../../../src/modules/notify/controller');

experiment('modules/notify/routes', () => {
  beforeEach(async () => {

  });

  afterEach(async () => {
    sandbox.restore();
  });

  experiment('.notifyCallback', () => {
    let server, request;

    beforeEach(async () => {
      server = await testHelpers.createServerForRoute(routes.notifyCallback, false);
      request = {
        method: 'POST',
        url: '/water/1.0/notify/callback',
        payload: {}
      };
    });

    test('validates the id must be a uuid', async () => {
      request.payload.id = 'yada-yada';
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(400);
    });

    test('validates the reference must be a uuid', async () => {
      request.payload.reference = 'yada-yada';
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(400);
    });

    test('accepts a valid payload', async () => {
      request.payload.id = await uuid();
      request.payload.reference = await uuid();
      const output = await server.inject(request);
      expect(output.statusCode).to.equal(200);
    });

    test('has the correct method', () => {
      expect(routes.notifyCallback.method).to.equal('POST');
    });

    test('has the correct controller', () => {
      expect(routes.notifyCallback.handler).to.equal(controller.callback);
    });

    test('has the correct path', () => {
      expect(routes.notifyCallback.path).endsWith('/notify/callback');
    });
  });
});
