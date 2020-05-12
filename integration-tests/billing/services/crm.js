'use strict';

const { serviceRequest } = require('@envage/water-abstraction-helpers');

const config = require('../../../config');

const data = require('./data');

/**
 * Entity cache used to temporarily store CRM entities
 * @type {Object}
 */
const entityCache = {
  companies: {},
  invoiceAccounts: {}
};

/**
 * Creates a company in the CRM
 * @param {String} scenarioKey
 * @return {Promise<Object>} CRM company entity
 */
const createCompany = async scenarioKey => {
  const uri = `${config.services.crm_v2}/companies`;
  const options = {
    body: {
      ...data.companies[scenarioKey],
      isTest: true
    }
  };
  return serviceRequest.post(uri, options);
};

/**
 * Creates company in CRM or retrieves from cache
 * @param {String} scenarioKey
 * @return {Promise<Object>} CRM company entity
 */
const getOrCreateCompany = async scenarioKey => {
  if (!(scenarioKey in entityCache.companies)) {
    entityCache.companies[scenarioKey] = await createCompany(scenarioKey);
  }
  return entityCache.companies[scenarioKey];
};

/**
 * Creates an invoice account in the CRM
 * @param {String} companyKey
 * @param {String} invoiceAccountKey
 * @return {Promise<Object>} CRM invoice account entity
 */
const createInvoiceAccount = async (companyId, scenarioKey) => {
  const uri = `${config.services.crm_v2}/invoice-accounts`;
  const options = {
    body: {
      companyId,
      ...data.invoiceAccounts[scenarioKey],
      isTest: true
    }
  };
  console.log(options);
  return serviceRequest.post(uri, options);
};

/**
 * Gets or creates invoice account
 * @param {String} companyKey - scenario key for company
 * @param {String} invoiceAccountKey - scenario key for invoice account
 * @return {Promise<Object>} CRM invoice account entity
 */
const getOrCreateInvoiceAccount = async (companyKey, invoiceAccountKey) => {
  if (!(invoiceAccountKey in entityCache.invoiceAccounts)) {
    const company = await getOrCreateCompany(companyKey);
    entityCache.invoiceAccounts[invoiceAccountKey] = await createInvoiceAccount(company.companyId, invoiceAccountKey);
  }
  return entityCache.invoiceAccounts[invoiceAccountKey];
};

/**
 * Clears the entity cache
 */
const clearEntityCache = () => {
  entityCache.companies = {};
  entityCache.invoiceAccounts = {};
};

/**
 * Tears down data in CRM and clears entity cache
 * @return {Promise}
 */
const tearDown = async () => {
  clearEntityCache();
  const uri = `${config.services.crm_v2}/test-data`;
  return serviceRequest.delete(uri);
};

exports.getOrCreateCompany = getOrCreateCompany;
exports.getOrCreateInvoiceAccount = getOrCreateInvoiceAccount;
exports.tearDown = tearDown;
