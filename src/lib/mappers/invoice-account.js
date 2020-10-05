'use strict';

const InvoiceAccount = require('../models/invoice-account');

const companyMapper = require('./company');
const invoiceAccountAddressMapper = require('./invoice-account-address');
const { createMapper } = require('../object-mapper');
const { createModel } = require('./lib/helpers');
/**
 * Maps CRM invoice account and (optionally) company data to a water service model
 * @param {Object} invoiceAccount - CRM invoice account data
 * @param {Object} company - CRM company data
 * @return {InvoiceAccount}
 */
const crmToModel = invoiceAccount => {
  const invoiceAccountModel = new InvoiceAccount(invoiceAccount.invoiceAccountId);
  invoiceAccountModel.fromHash({
    accountNumber: invoiceAccount.invoiceAccountNumber,
    company: companyMapper.crmToModel(invoiceAccount.company)
  });

  if (invoiceAccount.invoiceAccountAddresses) {
    invoiceAccountModel.invoiceAccountAddresses = invoiceAccount.invoiceAccountAddresses.map(invoiceAccountAddressMapper.crmToModel);
  }

  return invoiceAccountModel;
};

const pojoToModelMapper = createMapper()
  .copy(
    'id',
    'accountNumber'
  )
  .map('company').to('company', companyMapper.pojoToModel);

/**
 * Converts a plain object representation of a InvoiceAccount to a InvoiceAccount model
 * @param {Object} pojo
 * @return InvoiceAccount
 */
const pojoToModel = pojo => createModel(InvoiceAccount, pojo, pojoToModelMapper);

exports.crmToModel = crmToModel;
exports.pojoToModel = pojoToModel;
