'use strict';
const queries = require('./queries/licence-version-purpose-conditions');
const helpers = require('./lib/helpers');
const raw = require('./lib/raw');

const LicenceVersionPurposeConditions = require('../bookshelf/LicenceVersionPurposeConditions');
/**
 * Gets a specific licence version purpose condition by its ID.
 * @param {String} id
 * @return {Promise<Array>}
 */
const findOneById = async id => helpers.findOne(LicenceVersionPurposeConditions, 'licenceVersionPurposeConditionId', id);

const findManyByLicenceId = (licenceId, code = null) => {
  return !code
    ? raw.multiRow(queries.findLicenceVersionPurposeConditionsByLicenceId, { licenceId })
    : raw.multiRow(queries.findLicenceVersionPurposeConditionsByLicenceIdWithSpecificCode, { licenceId, code });
};

const getLicenceVersionConditionByPartialExternalId = async partialExternalId => {
  const { licenceVersionPurposeConditionId } = await raw.singleRow(queries.getLicenceVersionConditionByPartialExternalId, { partialExternalId: `${partialExternalId}\%` });
  return licenceVersionPurposeConditionId;
};

const getLicenceVersionConditionType = async id => {
  const { licenceVersionPurposeConditionTypeId } = await raw.singleRow(queries.getLicenceVersionConditionType, { id });
  return licenceVersionPurposeConditionTypeId;
};

exports.findOneById = findOneById;
exports.findManyByLicenceId = findManyByLicenceId;
exports.getLicenceVersionConditionByPartialExternalId = getLicenceVersionConditionByPartialExternalId;
exports.getLicenceVersionConditionType = getLicenceVersionConditionType;
