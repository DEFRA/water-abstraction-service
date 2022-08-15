/**
 * Creates a client connector for the CRM verification API endpoint
 * @module lib/connectors/crm-licences
 */
const { APIClient } = require('@envage/hapi-pg-rest-api')
const rp = require('request-promise-native').defaults({
  proxy: null,
  strictSSL: false
})
const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')
const urlJoin = require('url-join')
const { isArray, flatMap, chunk } = require('lodash')

// Create API client
const client = new APIClient(rp, {
  endpoint: `${config.services.crm}/documentHeader`,
  headers: {
    Authorization: process.env.JWT_TOKEN
  }
})

/**
 * Get all registered licences - i.e. ones with a company entity ID set
 * @return {Promise} resolves with array of CRM document headers
 */
client.getRegisteredLicences = async function () {
  const getRegisteredLicencePage = (page = 1) => {
    const filter = {
      company_entity_id: {
        $ne: null
      }
    }
    return client.findMany(filter, null, { page, perPage: 250 })
  }

  // Get first page of results
  const { error, data, pagination } = await getRegisteredLicencePage(1)

  if (error) {
    throw error
  }

  for (let i = 2; i <= pagination.pageCount; i++) {
    const { data: nextPage, error: nextError } = await getRegisteredLicencePage(i)
    if (nextError) {
      throw nextError
    }
    data.push(...nextPage)
  }

  return data
}

/**
 * Get a list of licences based on the supplied options
 * @param {Object} filter - criteria to filter licence list
 * @param {String} [filter.entity_id] - the current user's entity ID
 * @param {String} [filter.email] - the email address to search on
 * @param {String} [filter.string] - the search query, can be licence number, user-defined name etc.
 * @param {Object} [sort] - fields to sort on
 * @param {Number} [sort.licenceNumber] - sort on licence number, +1 : asc, -1 : desc
 * @param {Number} [sort.name] - sort on licence name, +1 : asc, -1 : desc
 * @param {Object} [pagination] - pagination controls
 * @param {Number} [pagination.page] - the current page
 * @param {Number} [pagination.perPage] - per page
 * @return {Promise} resolves with array of licence records
 * @example getLicences({entity_id : 'guid'})
 */
client.getDocumentRoles = function (filter, sort = {}, pagination = { page: 1, perPage: 100 }) {
  const uri = config.services.crm + '/document_role_access?filter=' + JSON.stringify(filter)
  return rp({
    uri,
    method: 'GET',
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    json: true,
    body: { filter, sort, pagination }
  })
}

/**
 * Get single licence
 * @param {String} [document_id] - the ID of the document to find
 * @return {Promise} resolves with single licence record
 */
client.getDocument = function (documentId, includeExpired = false) {
  const filter = JSON.stringify({ includeExpired })
  const url = urlJoin(config.services.crm, 'documentHeader', documentId)

  return serviceRequest.get(url, {
    qs: {
      filter
    }
  })
}

/**
 * Get a list of documents with contacts attached
 * @param {Object} filter
 * @return {Promise} reoslves with array of licence records with contact data
 */
client.getDocumentContacts = function (filter = {}) {
  return rp({
    uri: `${config.services.crm}/contacts`,
    method: 'GET',
    headers: {
      Authorization: process.env.JWT_TOKEN
    },
    json: true,
    qs: { filter: JSON.stringify(filter) }
  })
}

/**
 * Get all CRM contacts for the given licence number(s)
 * Strips the response envelope
 * @param  {String|Array} licenceNumber(s)
 * @return {Promise<Array>} array of document records decorated with contacts
 */
client.getLicenceContacts = async licenceNumber => {
  const licenceNumbers = isArray(licenceNumber) ? licenceNumber : [licenceNumber]
  const filter = {
    regime_entity_id: config.crm.waterRegime,
    system_external_id: { $in: licenceNumbers }
  }
  const result = await client.getDocumentContacts(filter)
  return result.data
}

client.getDocumentUsers = async documentId => {
  const url = urlJoin(config.services.crm, 'documents', documentId, 'users')
  return serviceRequest.get(url)
}

if (!config.isProduction) {
  client.deleteAcceptanceTestData = () => {
    const url = urlJoin(config.services.crm, 'acceptance-tests/documents')
    return serviceRequest.delete(url)
  }
}

/**
   * Set licence name
   * @param {String} documentId - the CRM document ID identifying the permit
   * @param {String} name - the user-defined document name
   * @return {Promise} resolves when name updated
   */
client.setLicenceName = async (documentId, name) => {
  return client.updateOne(documentId, {
    document_name: name
  })
}

/**
 * Gets documents from the CRM using the licence number
 *
 * @param {Array<String>} licenceNumbers One or many licence numbers to use to find documents for
 */
client.getDocumentsByLicenceNumbers = async (licenceNumbers, includeExpired = false) => {
  // run in batches of 20 so not to exceed the permitted request
  // query string size
  const batches = chunk(licenceNumbers, 20)

  const documentBatches = await Promise.all(
    batches.map(ids => {
      return client.findAll({
        system_external_id: {
          $in: ids
        },
        includeExpired
      })
    })
  )

  return flatMap(documentBatches)
}

module.exports = client
