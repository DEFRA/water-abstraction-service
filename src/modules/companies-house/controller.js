'use strict';

const companiesHouseService = require('./services/companies-house');

/**
 * Search companies house API
 * @param {Object} request
 * @param {String} request.query.q - the search term, e.g. company name or number
 * @param {Number} request.query.page - the page number of paginated result set
 * @param {*} h
 */
const getCompaniesHouseCompanies = async (request) => {
  const { q, page } = request.query;

  return companiesHouseService.searchCompanies(q, page);
};

exports.getCompaniesHouseCompanies = getCompaniesHouseCompanies;
