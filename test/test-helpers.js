'use strict';

const { cloneDeep } = require('lodash');
const Hapi = require('@hapi/hapi');

const validate = async () => ({ isValid: true });

/**
 * Creates a HAPI server to allow a single route to be
 * tested. The route handler is replaced with
 * a simple ok 200 response to allow the route definition to
 * be tested.
 *
 * @param {Object} route The HAPI route definition
 * @param {Boolean} [isAuth] Whether to add authentication to the server
 */
const createServerForRoute = async (route, isAuth = false) => {
  const server = Hapi.server();

  if (isAuth) {
    await server.register(require('@hapi/basic'));
    server.auth.strategy('simple', 'basic', { validate });
    server.auth.default('simple');
  }

  const testRoute = cloneDeep(route);
  testRoute.handler = async () => 'ok';
  if (testRoute.options) {
    testRoute.options.pre = [];
  }

  server.route(testRoute);

  return server;
};

exports.createServerForRoute = createServerForRoute;
