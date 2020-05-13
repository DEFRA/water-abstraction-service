'use strict';

const crmConnector = require('./connectors/crm');
const data = require('./data');

/**
 * Entity cache used to temporarily store CRM entities
 * @type {Object}
 */
const entityCache = {
  companies: {},
  invoiceAccounts: {},
  addresses: {}
};

/**
 * Gets a company in the CRM or retrieves from entity cache
 * @param {String} scenarioKey
 * @return {Promise<Object>} CRM company entity
 */
const createCompany = async scenarioKey => {
  if (!(scenarioKey in entityCache.companies)) {
    entityCache.companies[scenarioKey] = await crmConnector.createCompany(data.companies[scenarioKey]);
  }
  return entityCache.companies[scenarioKey];
};

/**
 * Gets a company in the CRM or retrieves from entity cache
 * @param {String} scenarioKey
 * @return {Promise<Object>} CRM company entity
 */
const createAddress = async scenarioKey => {
  if (!(scenarioKey in entityCache.addresses)) {
    entityCache.addresses[scenarioKey] = await crmConnector.createAddress(data.addresses[scenarioKey]);
  }
  return entityCache.addresses[scenarioKey];
};

/**
 * Gets or creates invoice account
 * @param {String} scenarioKey - scenario key for invoice account
 * @return {Promise<Object>} CRM invoice account entity
 */
const createInvoiceAccount = async scenarioKey => {
  const { company: companyKey, addresses, ...rest } = data.invoiceAccounts[scenarioKey];

  if (!(scenarioKey in entityCache.invoiceAccounts)) {
    // Get or create company
    const company = await createCompany(companyKey);

    // Create invoice account
    const invoiceAccount = await crmConnector.createInvoiceAccount(company.companyId, rest);
    entityCache.invoiceAccounts[scenarioKey] = invoiceAccount;

    // Create addresses
    for (const invoiceAddress of addresses) {
      const address = await createAddress(invoiceAddress.address);
      await crmConnector.createInvoiceAccountAddress(
        invoiceAccount.invoiceAccountId,
        address.addressId,
        invoiceAddress.startDate,
        invoiceAddress.endDate
      );
    }
  }
  return entityCache.invoiceAccounts[scenarioKey];
};

/**
 * Clears the entity cache
 */
const clearEntityCache = () => {
  entityCache.companies = {};
  entityCache.invoiceAccounts = {};
  entityCache.addresses = {};
};

/**
 * Tears down data in CRM and clears entity cache
 * @return {Promise}
 */
const tearDown = async () => {
  clearEntityCache();
  return crmConnector.tearDown();
};

exports.createCompany = createCompany;
exports.createInvoiceAccount = createInvoiceAccount;
exports.tearDown = tearDown;
