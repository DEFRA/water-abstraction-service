'use strict';

const FixtureLoader = require('./fixture-loader/FixtureLoader');
const AsyncAdapter = require('./fixture-loader/adapters/AsyncAdapter');

const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../config');
const urlJoin = require('url-join');
const createReturnsUrl = (...parts) => urlJoin(config.services.returns, ...parts);

// Resolve path to fixtures directory
const path = require('path');
const dir = path.resolve(__dirname, '../fixtures');

const createConnector = tail => async body => {
  const { data } = await serviceRequest.post(createReturnsUrl(tail), { body });
  return data;
};

const create = () => {
  // Create Returns service fixture loader
  const asyncAdapter = new AsyncAdapter();
  asyncAdapter
    .add('Return', createConnector('returns'))
    .add('Version', createConnector('versions'))
    .add('Line', createConnector('lines'));
  return new FixtureLoader(asyncAdapter, dir);
};

module.exports = create;
