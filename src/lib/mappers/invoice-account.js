'use strict';

const InvoiceAccount = require('../models/invoice-account');

const company = require('./company');
const invoiceAccountAddress = require('./invoice-account-address');

/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @param {Object} company - CRM company data
 * @return {InvoiceAccount}
 */
const crmToModel = (invoiceAccount) => {
  const invoiceAccountModel = new InvoiceAccount(invoiceAccount.invoiceAccountId);
  invoiceAccountModel.fromHash({
    accountNumber: invoiceAccount.invoiceAccountNumber || invoiceAccount.accountNumber,
    agentCompany: company.crmToModel(invoiceAccount.agentCompany)
  });

  if (invoiceAccount.company) {
    invoiceAccountModel.company = company.crmToModel(invoiceAccount.company);
  }

  if (invoiceAccount.invoiceAccountAddresses) {
    invoiceAccountModel.invoiceAccountAddresses = invoiceAccount.invoiceAccountAddresses.map(invoiceAccountAddress.crmToModel);
  }

  return invoiceAccountModel;
};

exports.crmToModel = crmToModel;
