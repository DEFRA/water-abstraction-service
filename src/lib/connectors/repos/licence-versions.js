'use strict';

const LicenceVersion = require('../bookshelf/LicenceVersion');

/**
 * Gets a list of licence versions for the given licence id
 * @param {String} licenceId - licence id
 * @return {Promise<Array>}
 */
const findByLicenceId = async licenceId => {
  const licenceVersions = await LicenceVersion
    .forge()
    .where('licence_id', licenceId)
    .fetchAll();

  return licenceVersions.toJSON();
};

exports.findByLicenceId = findByLicenceId;
