'use strict';
const repos = require('../../lib/connectors/repos');
const mapper = require('../../lib/mappers/supported-source');

/**
 * Get all supported sources
 */
const getSupportedSources = async request => {
  const supportedSources = await repos.supportedSources.findAll();
  return { data: supportedSources.map(mapper.dbToModel) };
};

exports.getSupportedSources = getSupportedSources;
