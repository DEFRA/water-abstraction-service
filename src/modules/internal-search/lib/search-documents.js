'use strict'

const waterHelpers = require('@envage/water-abstraction-helpers')
const { throwIfError } = require('@envage/hapi-pg-rest-api')
const documents = require('../../../lib/connectors/crm/documents')
const { getPagination } = require('./pagination')
const { returnsToIso } = waterHelpers.nald.dates
const { getFullName } = require('../../../lib/licence-transformer/nald-helpers')
const licencesService = require('../../../lib/services/licences')

const validateRowMetadata = row => {
  if (!row.metadata) {
    const err = new Error('No metadata for document')
    err.params = {
      documentId: row.document_id,
      licenceRef: row.system_external_id
    }
    throw err
  }
}

/**
 * Gets full name for a licence
 * @param  {[type]} documentHeader [description]
 * @return {[type]}                [description]
 */
const getLicenceHolderNameFromDocumentHeader = (documentHeader) => {
  const {
    Name: lastName,
    Forename: firstName,
    Initials: initials,
    Salutation: salutation
  } = documentHeader.metadata
  return getFullName(salutation, initials, firstName, lastName)
}

const mapRow = (row, licencesMap) => {
  validateRowMetadata(row)

  return {
    documentId: row.document_id,
    licenceNumber: row.system_external_id,
    licenceHolder: getLicenceHolderNameFromDocumentHeader(row),
    documentName: row.document_name,
    expires: returnsToIso(row.metadata.Expires),
    isCurrent: row.metadata.IsCurrent,
    licence: licencesMap.get(row.system_external_id)
  }
}

const getLicenceNumber = doc => doc.system_external_id

/**
 * Gets a map of Licence objects by licence number
 * @param {Object} response - from CRM lookup
 * @returns {Map} map of Licence instances by licence number
 */
const getLicencesMap = async response => {
  const licenceNumbers = [...new Set(
    response.data.map(getLicenceNumber)
  )]
  const licences = await licencesService.getLicencesByLicenceRefs(licenceNumbers)
  // Return as map
  return licences.reduce((map, licence) =>
    map.set(licence.licenceNumber, licence)
  , new Map())
}

/**
 * Searches documents with given query string
 *
 * Unlike most other searches in the application, this search will also request
 * expired documents to allow the submission of older returns data.
 * @param  {String} query - the user's search query
 * @return {Promise}        resolves with licences
 */
const searchDocuments = async (query, page = 1) => {
  const filter = {
    string: query,
    includeExpired: true // include expired documents
  }

  const columns = [
    'document_id',
    'system_external_id',
    'metadata',
    'document_name'
  ]

  const sort = {
    system_external_id: 1
  }

  const response = await documents.findMany(filter, sort, getPagination(page), columns)
  throwIfError(response.error)

  const licencesMap = await getLicencesMap(response)

  const { pagination } = response
  return {
    pagination,
    data: response.data.map(row => mapRow(row, licencesMap))
  }
}

exports.mapRow = mapRow
exports.searchDocuments = searchDocuments
