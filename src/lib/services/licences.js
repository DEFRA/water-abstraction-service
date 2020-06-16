'use strict';

const repos = require('../connectors/repos');
const licenceMapper = require('../mappers/licence');
const licenceVersionMapper = require('../mappers/licence-version');

/**
 * Gets a licence model by ID
 * @param {String} licenceId
 * @return {Promise<Licence>}
 */
const getLicenceById = async licenceId => {
  const data = await repos.licences.findOne(licenceId);
  return data && licenceMapper.dbToModel(data);
};

const getLicenceVersions = async licenceId => {
  const versions = await repos.licenceVersions.findByLicenceId(licenceId);
  return versions.map(licenceVersionMapper.dbToModel);
};

exports.getLicenceById = getLicenceById;
exports.getLicenceVersions = getLicenceVersions;
