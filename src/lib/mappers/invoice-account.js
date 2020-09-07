'use strict';

const InvoiceAccount = require('../models/invoice-account');

const companyMapper = require('./company');
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
    accountNumber: invoiceAccount.invoiceAccountNumber,
    company: companyMapper.crmToModel(invoiceAccount.company)
  });

  if (invoiceAccount.invoiceAccountAddresses) {
    invoiceAccountModel.invoiceAccountAddresses = invoiceAccount.invoiceAccountAddresses.map(invoiceAccountAddress.crmToModel);
  }

  return invoiceAccountModel;
};

const pojoToModel = object => {
  const model = new InvoiceAccount();
  model.pickFrom(object, ['id', 'accountNumber']);
  if (object.company) {
    model.company = companyMapper.pojoToModel(object.company);
  }
  return model;
};

exports.crmToModel = crmToModel;
exports.pojoToModel = pojoToModel;
