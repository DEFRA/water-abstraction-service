'use strict'
const requestPromise = require('./external-http')
const config = require('../../../config')

const getCommonOptions = () => {
  const apiKeyBase64Encoded = Buffer.from(config.companiesHouse.apiKey).toString('base64')
  return {
    headers: {
      Authorization: `Basic ${apiKeyBase64Encoded}`
    },
    json: true
  }
}

/**
 * Search companies house companies with the supplied query string
 * @param {String} q - search query string
 * @param {Number} startIndex - the index of the item to return from in the result set
 * @param {Number} perPage - the number of results to retrieve per page
 * @return {Promise}
 */
const searchCompanies = async (q, startIndex = 0, perPage = 20) => {
  const options = {
    method: 'GET',
    uri: 'https://api.companieshouse.gov.uk/search/companies',
    qs: {
      q,
      start_index: startIndex,
      items_per_page: perPage
    },
    ...getCommonOptions()
  }
  return requestPromise.externalHttp(options)
}

/**
 * Gets company by company number
 * @param {String} companyNumber -
 * @return {Promise}
 */
const getCompany = companyNumber => {
  const options = {
    method: 'GET',
    uri: `https://api.companieshouse.gov.uk/company/${companyNumber}`,
    ...getCommonOptions()
  }
  return requestPromise.externalHttp(options)
}

exports.searchCompanies = searchCompanies
exports.getCompany = getCompany
