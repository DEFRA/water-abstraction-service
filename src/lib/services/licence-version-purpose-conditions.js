'use strict';

const licenceVersionPurposeConditionsRepo = require('../connectors/repos/licence-version-purpose-conditions');
const mapper = require('../mappers/licence-version-purpose-conditions');
const service = require('./service');

const getLicenceVersionConditionById = id =>
  service.findOne(id, licenceVersionPurposeConditionsRepo.findOneById, mapper);

/**
 *
 * @param {String} licenceId
 * @returns {Promise<Object>}
 */
const getLicenceVersionPurposeConditionsByLicenceId = async (licenceId) => {
  const data = await licenceVersionPurposeConditionsRepo.findManyByLicenceId(licenceId);

  return {
    data: data.rows
  };
};

exports.getLicenceVersionConditionById = getLicenceVersionConditionById;
exports.getLicenceVersionPurposeConditionsByLicenceId = getLicenceVersionPurposeConditionsByLicenceId;
