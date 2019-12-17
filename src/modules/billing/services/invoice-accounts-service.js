'use strict';

const InvoiceAccount = require('../../../lib/models/invoice-account');
const Company = require('../../../lib/models/company');
const invoiceAccountsConnector = require('../../../lib/connectors/crm-v2/invoice-accounts');

const getByInvoiceAccountIds = async ids => {
  const invoiceAccounts = await invoiceAccountsConnector.getInvoiceAccountsByIds(ids);

  return invoiceAccounts.map(invoiceAccount => {
    const companyModel = new Company(invoiceAccount.company.companyId);
    companyModel.pickFrom(invoiceAccount.company, ['type', 'name']);

    const invoiceAccountModel = new InvoiceAccount(invoiceAccount.invoiceAccountId);
    invoiceAccountModel.accountNumber = invoiceAccount.invoiceAccountNumber;
    invoiceAccountModel.company = companyModel;

    return invoiceAccountModel;
  });
};

exports.getByInvoiceAccountIds = getByInvoiceAccountIds;
