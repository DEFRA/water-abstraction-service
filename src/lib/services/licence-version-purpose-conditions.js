'use strict';

const licenceVersionPurposeConditionsRepo = require('../connectors/repos/licence-version-purpose-conditions');
const mapper = require('../mappers/licence-version-purpose-conditions');
const service = require('./service');

const getLicenceVersionConditionById = id =>
  service.findOne(id, licenceVersionPurposeConditionsRepo.findOneById, mapper);

/**
 *
 * @param {String} licenceId
 * @param code - optionally specify a code
 * @returns {Promise<Object>}
 */
const getLicenceVersionPurposeConditionsByLicenceId = async (licenceId, code) => {
  const data = await licenceVersionPurposeConditionsRepo.findManyByLicenceId(licenceId, code);
  return {
    data: data.map(mapper.dbToModel)
  };
};

exports.getLicenceVersionConditionById = getLicenceVersionConditionById;
exports.getLicenceVersionPurposeConditionsByLicenceId = getLicenceVersionPurposeConditionsByLicenceId;
