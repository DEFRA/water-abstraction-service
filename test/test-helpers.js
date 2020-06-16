'use strict';

const { cloneDeep } = require('lodash');
const Hapi = require('@hapi/hapi');

/**
 * Creates a HAPI server to allow a single route to be
 * tested. The route handler is replaced with
 * a simple ok 200 response to allow the route definition to
 * be tested.
 *
 * @param {Object} route The HAPI route definition
 */
const createServerForRoute = route => {
  const server = Hapi.server();
  const testRoute = cloneDeep(route);
  testRoute.handler = async () => 'ok';

  server.route(testRoute);

  return server;
};

exports.createServerForRoute = createServerForRoute;
