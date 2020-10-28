const { get, partialRight } = require('lodash');
const { NotFoundError } = require('../../../../../lib/errors');
const crmV2 = require('../../../../../lib/connectors/crm-v2');

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
  getInvoiceAccount(chargeVersion)
]);

exports.getCRMData = getCRMData;
