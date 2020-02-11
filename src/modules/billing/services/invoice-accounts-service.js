'use strict';

const invoiceAccountsConnector = require('../../../lib/connectors/crm-v2/invoice-accounts');
const mappers = require('../mappers');

/**
 * Gets invoice accounts with specified IDs from CRM and
 * returns as an array of InvoiceAccount models
 * @param {Array<String>} ids - GUIDs for CRM invoice account IDs
 * @return {Promise<Array>}
 */
const getByInvoiceAccountIds = async (ids = []) => {
  if (ids.length === 0) {
    return [];
  }

  const invoiceAccounts = await invoiceAccountsConnector.getInvoiceAccountsByIds(ids);

  return invoiceAccounts.map(invoiceAccount =>
    mappers.invoiceAccount.crmToModel(invoiceAccount)
  );
};

/**
 * Gets the invoice accounts with the specified ID from CRM and
 * returns as an InvoiceAccount model
 * @param String id - GUID for CRM invoice account ID
 * @return {Promise<InvoiceAccount>}
 */
const getByInvoiceAccountId = async id => {
  const invoiceAccount = await invoiceAccountsConnector.getInvoiceAccountById(id);
  return mappers.invoiceAccount.crmToModel(invoiceAccount);
};

exports.getByInvoiceAccountIds = getByInvoiceAccountIds;
exports.getByInvoiceAccountId = getByInvoiceAccountId;
