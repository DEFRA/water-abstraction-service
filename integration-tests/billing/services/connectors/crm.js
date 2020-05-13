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
 * @param {String} addressKey
 * @return {Promise<Object>} CRM invoice account entity
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

const tearDown = () => {
  const uri = `${config.services.crm_v2}/test-data`;
  return serviceRequest.delete(uri);
};

exports.createCompany = createCompany;
exports.createAddress = createAddress;
exports.createInvoiceAccount = createInvoiceAccount;
exports.createInvoiceAccountAddress = createInvoiceAccountAddress;
exports.tearDown = tearDown;
