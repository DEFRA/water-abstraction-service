'use strict'

const Boom = require('@hapi/boom')
const companiesHouseService = require('./services/companies-house-service')

/**
 * Search companies house API
 * @param {Object} request
 * @param {String} request.query.q - the search term, e.g. company name or number
 * @param {Number} request.query.page - the page number of paginated result set
 * @param {*} h
 */
const getCompaniesHouseCompanies = request => {
  const { q, page } = request.query
  return companiesHouseService.searchCompanies(q, page)
}

/**
 * Get companies house company by companyNumber
 * @param {Object} request
 * @param {String} request.params.companyNumber - the companies house number
 */
const getCompaniesHouseCompany = async request => {
  const { companyNumber } = request.params
  const company = await companiesHouseService.getCompany(companyNumber)
  return company || Boom.notFound(`Company ${companyNumber} not found`)
}

exports.getCompaniesHouseCompanies = getCompaniesHouseCompanies
exports.getCompaniesHouseCompany = getCompaniesHouseCompany
