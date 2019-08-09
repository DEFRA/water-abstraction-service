'use strict';

const Hapi = require('@hapi/hapi');

const { expect } = require('@hapi/code');
const { experiment, test } = exports.lab = require('@hapi/lab').script();

const routes = require('../../../src/modules/users/routes');

/**
 * Creates a test Hapi server that has not other plugins loaded,
 * does not require auth and will rewrite the handler function to
 * return a test stub.
 *
 * This allows the route validation to be tested in isolation.
 *
 * @param {Object} route The route to test
 */
const getServer = route => {
  const server = Hapi.server({ port: 80 });
  route.handler = (req, h) => h.response('Test handler').code(201);
  server.route(route);
  return server;
};

experiment('modules/users/routes', () => {
  experiment('postUserInternal', () => {
    test('returns a 400 for an email not ending with .gov.uk', async () => {
      const server = getServer(routes.postUserInternal);
      const response = await server.inject({
        method: 'POST',
        url: '/water/1.0/user/internal',
        payload: {
          callingUserId: 100,
          newUserEmail: 'test@example.com',
          permissionsKey: 'basic'
        }
      });

      expect(response.statusCode).to.equal(400);
    });

    test('returns the controller stub for a valid email', async () => {
      const server = getServer(routes.postUserInternal);
      const response = await server.inject({
        method: 'POST',
        url: '/water/1.0/user/internal',
        payload: {
          callingUserId: 100,
          newUserEmail: 'test@example.gov.uk',
          permissionsKey: 'basic'
        }
      });

      expect(response.payload).to.equal('Test handler');
      expect(response.statusCode).to.equal(201);
    });

    test('the callingUserId must be an integer', async () => {
      const server = getServer(routes.postUserInternal);
      const response = await server.inject({
        method: 'POST',
        url: '/water/1.0/user/internal',
        payload: {
          callingUserId: '00000000-0000-0000-0000-000000000000',
          newUserEmail: 'test@example.gov.uk',
          permissionsKey: 'basic'
        }
      });

      expect(response.statusCode).to.equal(400);
    });

    test('returns a 400 for an invalid permissions key', async () => {
      const server = getServer(routes.postUserInternal);
      const response = await server.inject({
        method: 'POST',
        url: '/water/1.0/user/internal',
        payload: {
          callingUserId: 100,
          newUserEmail: 'test@example.gov.uk',
          permissionsKey: 'not a valid key'
        }
      });

      expect(response.statusCode).to.equal(400);
    });
  });
});
