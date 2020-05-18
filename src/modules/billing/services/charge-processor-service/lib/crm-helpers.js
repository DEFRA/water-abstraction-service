const { get, partialRight } = require('lodash');
const { NotFoundError } = require('../../../../../lib/errors');
const crmV2 = require('../../../../../lib/connectors/crm-v2');
const dateHelpers = require('./date-helpers');

const getDocumentByDate = async (chargeVersion, chargePeriodStartDate) => {
  const { licenceNumber } = chargeVersion.licence;

  // Load all CRM documents for licence
  const result = await crmV2.documents.getDocuments(licenceNumber);
  const documents = result || [];

  const document = dateHelpers.findByDate(documents, chargePeriodStartDate);

  if (!document) {
    throw new NotFoundError(`Document not found in CRM for ${licenceNumber} on ${chargePeriodStartDate}`); ;
  }
  return document;
};

/**
 * Gets CRM licence holder role for charge version or throws NotFoundError
 * @param {ChargeVersion} chargeVersion
 * @param {String} chargePeriodStartDate - YYYY-MM-DD
 * @return {Promise<Object>} CRM role data
 */
const getLicenceHolderRole = async (chargeVersion, chargePeriodStartDate) => {
  const { documentId } = await getDocumentByDate(chargeVersion, chargePeriodStartDate);

  // Load document roles for relevant document, and filter to find
  // the licence holder role at the start of the charge period
  const document = await crmV2.documents.getDocument(documentId);

  if (!document) {
    throw new NotFoundError(`Document ${documentId} not found in CRM`); ;
  }

  const role = dateHelpers.findByDate(
    document.documentRoles.filter(role => role.roleName === 'licenceHolder'),
    chargePeriodStartDate
  );
  if (!role) {
    throw new NotFoundError(`Licence holder role not found in CRM for document ${documentId} on ${chargePeriodStartDate}`);
  }
  return role;
};

/**
 * Makes CRM API call and throws error if not found
 * @param {ChargeVersion} chargeVersion
 * @param {Object} config
 * @param {String} config.property - the path to the ID property in the chargeVersion model
 * @param {Function} config.apiCall - the CRM API call
 * @param {String} config.name - the name of the entity, used to generate a meaningful error message
 * @return {Promise<Object>}
 */
const makeCRMAPICall = async (chargeVersion, config) => {
  const id = get(chargeVersion, config.property);
  const data = await config.apiCall(id);
  if (!data) {
    throw new NotFoundError(`${config.name} ${id} not found in CRM`);
  }
  return data;
};

const config = {
  getCompany: {
    property: 'company.id',
    apiCall: id => crmV2.companies.getCompany(id),
    name: 'Company'
  },
  getInvoiceAccount: {
    property: 'invoiceAccount.id',
    apiCall: id => crmV2.invoiceAccounts.getInvoiceAccountById(id),
    name: 'Invoice account'
  }
};

/**
 * Get CRM company or throw not found error
 * @param {ChargeVersion}
 * @return {Promise<Object>}
 */
const getCompany = partialRight(makeCRMAPICall, config.getCompany);

/**
 * Get CRM invoice account or throw not found error
 * @param {ChargeVersion}
 * @return {Promise<Object>}
 */
const getInvoiceAccount = partialRight(makeCRMAPICall, config.getInvoiceAccount);

/**
 * Loads CRM data for charge processing
 * @param {ChargeVersion} chargeVersion
 * @param {String} chargePeriodStartDate
 * @return {Promise<Array>}
 */
const getCRMData = (chargeVersion, chargePeriodStartDate) => Promise.all([
  getCompany(chargeVersion),
  getInvoiceAccount(chargeVersion),
  getLicenceHolderRole(chargeVersion, chargePeriodStartDate)
]);

exports.getCRMData = getCRMData;
