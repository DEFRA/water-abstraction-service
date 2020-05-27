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
  addresses: {},
  documents: {},
  contacts: {}
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
 * Gets a contact in the CRM or retrieves from entity cache
 * @param {String} scenarioKey
 * @return {Promise<Object>} CRM contact entity
 */
const createContact = async scenarioKey => {
  if (!scenarioKey) {
    return { contactId: null };
  }
  if (!(scenarioKey in entityCache.contacts)) {
    entityCache.contacts[scenarioKey] = await crmConnector.createContact(data.contacts[scenarioKey]);
  }
  return entityCache.contacts[scenarioKey];
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
 * Creates a document role
 * @TODO support contact in role
 * @param {Object} document - CRM document
 * @param {Object} role
 * @return {Promise}
 */
const createDocumentRole = async (document, role) => {
  const { company: companyKey, address: addressKey, contact: contactKey, ...rest } = role;
  const [{ companyId }, { addressId }, { contactId }] = await Promise.all([
    createCompany(companyKey),
    createAddress(addressKey),
    createContact(contactKey)
  ]);
  await crmConnector.createDocumentRole(document.documentId, {
    companyId,
    addressId,
    contactId,
    ...rest
  });
};

/**
 * Gets or creates document
 * @param {String} scenarioKey
 * @param {Number} versionNumber
 * @return {Promise<Object>} CRM document entity
 */
const createDocument = async (scenarioKey, versionNumber) => {
  const cacheKey = `${scenarioKey}_${versionNumber}`;

  if (!(cacheKey in entityCache.documents)) {
    // Create document
    const { roles, ...rest } = data.licences[scenarioKey].documents.find(doc => doc.versionNumber === versionNumber);
    const document = await crmConnector.createDocument({
      documentRef: data.licences[scenarioKey].licenceRef,
      ...rest
    });
    entityCache.documents[cacheKey] = document;

    // Create document roles for document
    for (const role of roles) {
      await createDocumentRole(document, role);
    }
  }
  return entityCache.documents[cacheKey];
};

/**
 * Creates the CRM document records for the licence specified by
 * the scenario key
 * @param {String} scenarioKey
 * @return {Promise}
 */
const createDocuments = async scenarioKey => {
  const { documents } = data.licences[scenarioKey];
  for (const document of documents) {
    await createDocument(scenarioKey, document.versionNumber);
  }
};

/**
 * Clears the entity cache
 */
const clearEntityCache = () => {
  entityCache.companies = {};
  entityCache.invoiceAccounts = {};
  entityCache.addresses = {};
  entityCache.documents = {};
  entityCache.contacts = {};
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
exports.createDocuments = createDocuments;
exports.tearDown = tearDown;
