'use strict';

const repos = require('../../../lib/connectors/repository');
const mappers = require('../mappers');

/**
 * Gets a licence by licence number
 * @param {String} licenceNumber
 * @return {Promise<Licence>}
 */
const getByLicenceNumber = async licenceNumber => {
  const row = await repos.licences.findOneByLicenceNumber(licenceNumber);
  return mappers.licence.dbToModel(row);
};

exports.getByLicenceNumber = getByLicenceNumber;
