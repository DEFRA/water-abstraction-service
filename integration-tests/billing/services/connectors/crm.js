'use strict';
const { serviceRequest } = require('@envage/water-abstraction-helpers');
const config = require('../../../../config');

/**
 * Creates a company in the CRM
 * @param {Object} data
 * @return {Promise<Object>} CRM company entity
 */
const createCompany = data => {
  const uri = `${config.services.crm_v2}/companies`;
  const options = {
    body: {
      ...data,
      isTest: true
    }
  };
  return serviceRequest.post(uri, options);
};

/**
 * Creates an invoice account in the CRM
 * @param {String} companyId
 * @param {Object} data
 * @return {Promise<Object>} CRM invoice account entity
 */
const createInvoiceAccount = (companyId, data) => {
  const uri = `${config.services.crm_v2}/invoice-accounts`;
  const options = {
    body: {
      companyId,
      ...data,
      isTest: true
    }
  };
  return serviceRequest.post(uri, options);
};

/**
 * Creates an address in the CRM
 * @param {Object} data
 * @return {Promise<Object>} CRM address entity
 */
const createAddress = data => {
  const uri = `${config.services.crm_v2}/addresses`;
  const options = {
    body: {
      ...data,
      isTest: true
    }
  };
  return serviceRequest.post(uri, options);
};

/**
 * Adds an address to an invoice account
 * @param {String} invoiceAccountId
 * @param {String} addressId
 * @param {String} startDate
 * @param {String|null} endDate
 * @return {Promise<Object>} CRM invoice account address entity
 */
const createInvoiceAccountAddress = (invoiceAccountId, addressId, startDate, endDate) => {
  const uri = `${config.services.crm_v2}/invoice-accounts/${invoiceAccountId}/addresses`;
  const options = {
    body: {
      addressId,
      startDate,
      endDate,
      isTest: true
    }
  };
  return serviceRequest.post(uri, options);
};

/**
 * Creates CRM document
 * @param {Object} data
 * @return {Promise<Object>} CRM document entity
 */
const createDocument = data => {
  const uri = `${config.services.crm_v2}/documents`;
  const options = {
    body: {
      ...data,
      regime: 'water',
      documentType: 'abstraction_licence',
      isTest: true
    }
  };
  return serviceRequest.post(uri, options);
};

/**
 * Creates CRM document role
 * @param {String} documentId
 * @param {Object} data
 * @return {Promise<Object>}
 */
const createDocumentRole = (documentId, data) => {
  const uri = `${config.services.crm_v2}/documents/${documentId}/roles`;
  const options = {
    body: {
      ...data,
      isTest: true
    }
  };
  return serviceRequest.post(uri, options);
};

/**
 * Creates CRM contact
 * @param {Object} data
 * @return {Promise<Object>} CRM contact entity
 */
const createContact = data => {
  const uri = `${config.services.crm_v2}/contacts`;
  const options = {
    body: {
      ...data,
      isTest: true
    }
  };
  return serviceRequest.post(uri, options);
};

/**
 * Deletes all test data in CRM
 * @return {Promise}
 */
const tearDown = () => {
  const uri = `${config.services.crm_v2}/test-data`;
  return serviceRequest.delete(uri);
};

exports.createCompany = createCompany;
exports.createAddress = createAddress;
exports.createInvoiceAccount = createInvoiceAccount;
exports.createInvoiceAccountAddress = createInvoiceAccountAddress;
exports.createDocument = createDocument;
exports.createDocumentRole = createDocumentRole;
exports.createContact = createContact;
exports.tearDown = tearDown;
