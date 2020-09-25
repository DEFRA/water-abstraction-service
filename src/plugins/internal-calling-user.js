'use strict';

/**
 * @module this plugin checks if a defra-internal-user-id header
 * is present on the inbound request.
 * Requests from the internal UI should have this header,
 * for the external UI it is absent.
 * The user is then loaded from the IDM and a check is made that
 * the user is for the correct IDM application ('water_admin' is the internal UI)
 * The IDM roles obtained are then set on the request auth.credentials.scope -
 * these can then easily be used to control access to routes.
 */

const Boom = require('@hapi/boom');
const { get, set } = require('lodash');

const { logger } = require('../logger');
const idmConnector = require('../lib/connectors/idm');
const User = require('../lib/models/user');

/**
 * Checks that the user is for the internal UI application
 * @param {Object} user
 * @return {Boolean}
 */
const validateUserIsInternal = user => {
  if (user.application !== 'water_admin') {
    throw new Error(`User with id ${user.user_id} is not a water admin user`);
  }
};

/**
 * Sets the current user on the current request so it is
 * available within controller actions.
 * Both a plain object and a User service model are set
 * for convenience.
 * @param {Object} request - hapi request
 * @param {Object} user
 */
const setUserOnRequest = (request, user) => {
  set(request, 'defra.internalCallingUser', {
    id: user.user_id,
    email: user.user_name
  });
  set(request, 'defra.internalCallingUserModel', new User(user.user_id, user.user_name));
};

/**
 * Uses the IDM roles the user has access to as 'scopes' on the
 * inbound request.  This can be used to control access to routes.
 * @param {Object} request - hapi request
 * @param {Object} user
 */
const setUserScope = (request, user) => {
  set(request, 'auth.credentials.scope', user.roles);
};

/**
 * This function is invoked on the 'onCredentials' phase of the hapi
 * request lifecycle
 * For internal UI calls, it fetches the IDM user and uses the
 * data to perform checks and set the user details on the request object.
 * @param {Object} request - hapi request
 * @param {Object} h - hapi response toolkit
 */
const onCredentials = async (request, h) => {
  // This should only be set for requests from the internal UI
  const userId = get(request, 'headers.defra-internal-user-id');

  if (userId) {
    try {
      const user = await idmConnector.usersClient.findOneById(userId);

      validateUserIsInternal(user);
      setUserOnRequest(request, user);
      setUserScope(request, user);
    } catch (e) {
      logger.error('Attempted to call resource with invalid defra-internal-user-id header', e);
      return Boom.forbidden('User not acceptable', { userId });
    }
  }
  return h.continue;
};

module.exports = {
  register: (server, options) => {
    server.ext({
      type: 'onCredentials',
      method: onCredentials
    });
  },

  pkg: {
    name: 'internalCallingUser',
    version: '1.0.0'
  }
};
