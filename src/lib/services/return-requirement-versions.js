'use strict';

const repos = require('../connectors/repos');
const returnVersionMapper = require('../mappers/return-requirement-version');

/**
 * Gets a list of all return requirement versions for the supplied licence ID
 * @param {String} licenceId
 * @return {Array<ReturnRequirementVersion>}
 */
const getByLicenceId = async licenceId => {
  const data = await repos.returnVersions.findByLicenceId(licenceId);
  return data.map(returnVersionMapper.dbToModel);
};

exports.getByLicenceId = getByLicenceId;
