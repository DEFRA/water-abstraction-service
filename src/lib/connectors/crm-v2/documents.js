'use strict'

const urlJoin = require('url-join')
const Joi = require('joi')
const moment = require('moment')

const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

const VALID_LICENCE_NUMBER = Joi.string().required().example('01/123/R01')
const VALID_GUID = Joi.string().guid().required()

const getDocumentsUrl = (...tail) => urlJoin(config.services.crm_v2, 'documents', ...tail)

const getDocumentRolesUrl = (...tail) => {
  return urlJoin(config.services.crm_v2, 'document-roles', ...tail)
}

/**
 * Get a list of documents for the given licence number
 * @param {String} licenceNumber
 * @return {Promise<Array>}
 */
const getDocuments = licenceNumber => {
  Joi.assert(licenceNumber, VALID_LICENCE_NUMBER)
  return serviceRequest.get(getDocumentsUrl(), {
    qs: {
      documentRef: licenceNumber,
      regime: 'water',
      documentType: 'abstraction_licence'
    }
  })
}

/**
 * Get a single document with its roles for given document ID
 * @param {String} licenceNumber
 * @return {Promise<Array>}
 */
const getDocument = documentId => {
  Joi.assert(documentId, VALID_GUID)
  return serviceRequest.get(getDocumentsUrl(documentId))
}

const createDocument = (documentRef, documentStatus = 'current', startDate = new Date().toJSON().slice(0, 10), endDate = null, isTest = false) => {
  const url = getDocumentsUrl()
  return serviceRequest.post(url, {
    body: {
      regime: 'water',
      documentType: 'abstraction_licence',
      versionNumber: '100',
      documentRef,
      status: documentStatus,
      startDate,
      endDate,
      isTest
    }
  })
}

const createDocumentRole = async (documentId, documentRole) => {
  const url = getDocumentsUrl(documentId, 'roles')
  return serviceRequest.post(url, { body: documentRole })
}

/**
 * Get a single document role for the requested ID
 * @param {String} licenceNumber
 * @return {Promise<Array>}
 */
const getDocumentRole = documentRoleId => {
  return serviceRequest.get(getDocumentRolesUrl(documentRoleId))
}

/**
 * Fetch a document by documentRef and date, to identify the responsible company
 *  @param {String} documentRef
 *  @param {String} date
 */
const getDocumentByRefAndDate = async (documentRef, date) => {
  return serviceRequest.get(getDocumentsUrl('search'), {
    qs: {
      date: moment(date).format('YYYY-MM-DD'),
      documentRef
    }
  })
}

exports.createDocument = createDocument
exports.createDocumentRole = createDocumentRole
exports.getDocument = getDocument
exports.getDocumentRole = getDocumentRole
exports.getDocuments = getDocuments
exports.getDocumentByRefAndDate = getDocumentByRefAndDate
