'use strict';
const { bookshelf } = require('../bookshelf');
const queries = require('./queries/licence-version-purpose-conditions');
const helpers = require('./lib/helpers');

const LicenceVersionPurposeConditions = require('../bookshelf/LicenceVersionPurposeConditions');
/**
 * Gets a specific licence version purpose condition by its ID.
 * @param {String} id
 * @return {Promise<Array>}
 */
const findOneById = async id => helpers.findOne(LicenceVersionPurposeConditions, 'licenceVersionPurposeConditionId', id);

const findManyByLicenceId = (licenceId, code = null) => {
  return !code
    ? bookshelf.knex.raw(queries.findLicenceVersionPurposeConditionsByLicenceId, { licenceId })
    : bookshelf.knex.raw(queries.findLicenceVersionPurposeConditionsByLicenceIdWithSpecificCode, { licenceId, code });
};

exports.findOneById = findOneById;
exports.findManyByLicenceId = findManyByLicenceId;
