'use strict'

const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../../config')
const urlJoin = require('url-join')

const createCrmUrl = (...parts) => urlJoin(config.services.crm_v2, ...parts)

/**
 * Creates a company in the CRM
 * @param {Object} data
 * @return {Promise<Object>} CRM company entity
 */
const createCompany = data => {
  const options = {
    body: {
      ...data,
      isTest: true
    }
  }
  return serviceRequest.post(createCrmUrl('companies'), options)
}

const createCompanyAddress = (companyId, addressId, startDate, endDate, roleName) => {
  const url = createCrmUrl('companies', companyId, 'addresses')
  const options = {
    body: {
      addressId,
      roleName,
      startDate,
      endDate,
      isDefault: true,
      isTest: true
    }
  }
  return serviceRequest.post(url, options)
}

/**
 * Creates an invoice account in the CRM
 * @param {String} companyId
 * @param {Object} data
 * @return {Promise<Object>} CRM invoice account entity
 */
const createInvoiceAccount = (companyId, data) => {
  const options = {
    body: {
      companyId,
      ...data,
      isTest: true
    }
  }
  return serviceRequest.post(createCrmUrl('invoice-accounts'), options)
}

/**
 * Creates an address in the CRM
 * @param {Object} data
 * @return {Promise<Object>} CRM address entity
 */
const createAddress = data => {
  const options = {
    body: {
      ...data,
      isTest: true
    }
  }
  return serviceRequest.post(createCrmUrl('addresses'), options)
}

/**
 * Adds an address to an invoice account
 * @param {String} invoiceAccountId
 * @param {String} addressId
 * @param {String} startDate
 * @param {String|null} endDate
 * @return {Promise<Object>} CRM invoice account address entity
 */
const createInvoiceAccountAddress = (invoiceAccountId, addressId, startDate, endDate) => {
  const url = createCrmUrl('invoice-accounts', invoiceAccountId, 'addresses')
  const options = {
    body: {
      addressId,
      startDate,
      endDate,
      contactId: null,
      agentCompanyId: null,
      isTest: true
    }
  }

  return serviceRequest.post(url, options)
}

/**
 * Creates CRM document
 * @param {Object} data
 * @return {Promise<Object>} CRM document entity
 */
const createDocument = data => {
  const url = createCrmUrl('documents')
  const options = {
    body: {
      ...data,
      regime: 'water',
      documentType: 'abstraction_licence',
      isTest: true
    }
  }
  return serviceRequest.post(url, options)
}

/**
 * Creates CRM document role
 * @param {String} documentId
 * @param {Object} data
 * @return {Promise<Object>}
 */
const createDocumentRole = (documentId, data) => {
  const url = createCrmUrl('documents', documentId, 'roles')
  const options = {
    body: {
      ...data,
      isTest: true
    }
  }
  return serviceRequest.post(url, options)
}

/**
 * Creates CRM contact
 * @param {Object} data
 * @return {Promise<Object>} CRM contact entity
 */
const createContact = data => {
  const options = {
    body: {
      ...data,
      isTest: true
    }
  }
  return serviceRequest.post(createCrmUrl('contacts'), options)
}

const getRole = roleName => {
  const url = createCrmUrl('roles', roleName)
  return serviceRequest.get(url)
}

/**
 * Deletes all test data in CRM
 * @return {Promise}
 */
const tearDown = () => serviceRequest.delete(createCrmUrl('test-data'))

exports.createAddress = createAddress
exports.createCompany = createCompany
exports.createCompanyAddress = createCompanyAddress
exports.createContact = createContact
exports.createDocument = createDocument
exports.createDocumentRole = createDocumentRole
exports.createInvoiceAccount = createInvoiceAccount
exports.createInvoiceAccountAddress = createInvoiceAccountAddress

exports.getRole = getRole

exports.tearDown = tearDown
