'use strict';

const InvoiceAccount = require('../../../lib/models/invoice-account');

const company = require('./company');
const address = require('./address');

/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @param {Object} company - CRM company data
 * @return {InvoiceAccount}
 */
const crmToModel = (invoiceAccount) => {
  const invoiceAccountModel = new InvoiceAccount(invoiceAccount.invoiceAccountId);
  invoiceAccountModel.accountNumber = invoiceAccount.invoiceAccountNumber;

  if (invoiceAccount.company) {
    invoiceAccountModel.company = company.crmToModel(invoiceAccount.company);
  }

  if (invoiceAccount.address) {
    invoiceAccountModel.address = address.crmToModel(invoiceAccount.address);
  }

  return invoiceAccountModel;
};

exports.crmToModel = crmToModel;
