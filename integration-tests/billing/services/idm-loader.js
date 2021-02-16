'use strict';

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter');

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../config');
const urlJoin = require('url-join');
const createIdmUrl = (...parts) => urlJoin(config.services.idm, ...parts);

// Resolve path to fixtures directory
const path = require('path');
const dir = path.resolve(__dirname, '../fixtures');

const create = () => {
// Create IDM fixture loader
  const idmAdapter = new AsyncAdapter();

  idmAdapter
    .add('User', async (body) => {
      const newUser = await serviceRequest.post(createIdmUrl('user'), { body });
      return newUser.data;
    })
    .add('Roles', ({ userId, ...body }) => {
      const newRoles = serviceRequest.put(createIdmUrl(`user/${userId}/roles`), { body });
      return newRoles.data;
    });

  return new FixtureLoader(idmAdapter, dir);
};

module.exports = create;
