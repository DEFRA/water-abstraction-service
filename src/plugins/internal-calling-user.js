'use strict';

const Boom = require('@hapi/boom');
const { get, set } = require('lodash');

const { logger } = require('../logger');
const idmConnector = require('../lib/connectors/idm');

const validateUserIsInternal = user => {
  if (user.application !== 'water_admin') {
    throw new Error(`User with id ${user.user_id} is not a water admin user`);
  }
};

const setUserOnRequest = (request, user) => {
  set(request, 'defra.internalCallingUser', {
    id: user.user_id,
    email: user.user_name
  });
};

const setUserScope = (request, user) => {
  set(request, 'auth.credentials.scope', user.roles);
};

const onCredentials = async (request, h) => {
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
