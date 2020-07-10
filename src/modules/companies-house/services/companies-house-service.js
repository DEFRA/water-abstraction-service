'use strict';

const companiesHouseApiConnector = require('../../../lib/connectors/companies-house');
const companiesHouseMapper = require('../mappers/companies-house');
const Pagination = require('../../../lib/models/pagination');

/**
 * Searches companies house companies by the supplied query string
 * Maps results to Company/Address/Contact service models
 * Only returns first page of results
 * @param {String} q - query string
 */
const searchCompanies = async (q, page) => {
  // Create pagination model
  const pagination = new Pagination();
  pagination.fromHash({
    page,
    perPage: 20
  });

  // Get data from companies house API
  const companiesHouseResponse = await companiesHouseApiConnector.searchCompanies(q, pagination.startIndex, pagination.perPage);

  // Map response
  return {
    pagination: companiesHouseMapper.mapPagination(companiesHouseResponse),
    data: companiesHouseResponse.items.map(companiesHouseMapper.mapItem)
  };
};

exports.searchCompanies = searchCompanies;
