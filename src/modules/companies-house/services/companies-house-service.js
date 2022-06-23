'use strict'

const companiesHouseApiConnector = require('../../../lib/connectors/companies-house')
const companiesHouseMapper = require('../mappers/companies-house')
const Pagination = require('../../../lib/models/pagination')
const { logger } = require('../../../logger')

/**
 * Searches companies house companies by the supplied query string
 * Maps results to Company/Address/Contact service models
 * Only returns first page of results
 * @param {String} q - query string
 */
const searchCompanies = async (q, page) => {
  // Create pagination model
  const pagination = new Pagination()
  pagination.fromHash({
    page,
    perPage: 20
  })

  // Get data from companies house API
  const companiesHouseResponse = await companiesHouseApiConnector.searchCompanies(q, pagination.startIndex, pagination.perPage)

  // Map response
  return {
    pagination: companiesHouseMapper.mapPagination(companiesHouseResponse),
    data: companiesHouseResponse.items.map(companiesHouseMapper.mapItem)
  }
}

/**
 * Gets a single company from Companies House
 * Maps to service model shape
 * @param {Number} q - companyNumber
 */
const getCompany = async companyNumber => {
  try {
    const data = await companiesHouseApiConnector.getCompany(companyNumber)

    return {
      company: companiesHouseMapper.mapCompany(data),
      address: companiesHouseMapper.mapAddress(data.registered_office_address)
    }
  } catch (err) {
    logger.error('Companies house API error', err)
    return null
  }
}

exports.searchCompanies = searchCompanies
exports.getCompany = getCompany
