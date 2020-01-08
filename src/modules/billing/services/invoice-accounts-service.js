'use strict';

const InvoiceAccount = require('../../../lib/models/invoice-account');
const Company = require('../../../lib/models/company');
const invoiceAccountsConnector = require('../../../lib/connectors/crm-v2/invoice-accounts');

/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @param {Object} company - CRM company data
 * @return {InvoiceAccount}
 */
const mapCRMInvoiceAccountToModel = (invoiceAccount, company) => {
  const invoiceAccountModel = new InvoiceAccount(invoiceAccount.invoiceAccountId);
  invoiceAccountModel.accountNumber = invoiceAccount.invoiceAccountNumber;

  if (company) {
    const companyModel = new Company(company.companyId);
    companyModel.pickFrom(company, ['type', 'name']);
    invoiceAccountModel.company = companyModel;
  }

  return invoiceAccountModel;
};

/**
 * Gets invoice accounts with specified IDs from CRM and
 * returns as an array of InvoiceAccount models
 * @param {Array<String>} ids - GUIDs for CRM invoice account IDs
 * @return {Promise<Array>}
 */
const getByInvoiceAccountIds = async ids => {
  const invoiceAccounts = await invoiceAccountsConnector.getInvoiceAccountsByIds(ids);

  return invoiceAccounts.map(invoiceAccount =>
    mapCRMInvoiceAccountToModel(invoiceAccount, invoiceAccount.company)
  );
};

exports.mapCRMInvoiceAccountToModel = mapCRMInvoiceAccountToModel;
exports.getByInvoiceAccountIds = getByInvoiceAccountIds;
