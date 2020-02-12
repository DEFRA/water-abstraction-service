'use strict';

const InvoiceAccount = require('../../../lib/models/invoice-account');
const Company = require('../../../lib/models/company');

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
    const companyModel = new Company(invoiceAccount.company.companyId);
    companyModel.pickFrom(invoiceAccount.company, ['type', 'name']);
    invoiceAccountModel.company = companyModel;
  }

  return invoiceAccountModel;
};

exports.crmToModel = crmToModel;
