const repos = require('../connectors/repos');
const mappers = require('../mappers');

/**
 * Gets a licence model by ID
 * @param {String} licenceId
 * @return {Promise<Licence>}
 */
const getLicenceById = async licenceId => {
  const data = await repos.licences.findOne(licenceId);
  return data && mappers.licence.dbToModel(data);
};

exports.getLicenceById = getLicenceById;
