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

exports.findOneById = findOneById;
exports.findManyByLicenceId = findManyByLicenceId;
