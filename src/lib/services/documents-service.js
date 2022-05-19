'use strict'

/**
 * @module services for interacting with CRM v2 documents
 */
const documentConnector = require('../connectors/crm-v2/documents')
const Document = require('../../lib/models/document')
const errors = require('../errors')
const documentMapper = require('../mappers/document')

/**
 * Get CRM documents for a given licence number
 * @param {String} licenceNumber
 * @return {Promise<Array>}
 */
const getDocuments = async licenceNumber => {
  const data = await documentConnector.getDocuments(licenceNumber)
  return data.map(documentMapper.crmToModel)
}

/**
 * Gets a single document for the given document ID
 * @param {String} documentId
 * @return {Promise<Document>}
 */
const getDocument = async documentId => {
  const data = await documentConnector.getDocument(documentId)
  if (!data) {
    throw new errors.NotFoundError(`Document ${documentId} not found`)
  }
  return documentMapper.crmToModel(data)
}

const isNotDraft = doc => doc.status !== Document.DOCUMENT_STATUS.draft

/**
 * Gets a current or superseded document for the given licence
 * and date
 * Draft documents are ignored
 * @param {String} licenceNumber
 */
const getValidDocumentOnDate = async (licenceNumber, date) => {
  const docs = await getDocuments(licenceNumber)
  const [doc] = docs.filter(doc => doc.dateRange.includes(date) && isNotDraft(doc))
  return doc ? getDocument(doc.id) : null
}

exports.getDocuments = getDocuments
exports.getDocument = getDocument
exports.getValidDocumentOnDate = getValidDocumentOnDate
