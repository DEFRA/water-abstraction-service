'use strict';
const request = require('./request');
const invoiceAccountsConnector = require('../../../lib/connectors/crm-v2/invoice-accounts');
const chargeModuleMappers = require('../../../lib/mappers/charge-module');

const getInvoiceAccountData = async (invoiceAccountId) => {
  const data = await invoiceAccountsConnector.getInvoiceAccountById(invoiceAccountId);
  const mappedData = await chargeModuleMappers.mapInvoiceAccountToChargeModuleCustomer(data);
  return mappedData;
};

const updateCustomer = async invoiceAccountId => {
  const data = await getInvoiceAccountData(invoiceAccountId);
  return request.post('v1/wrls/customer_changes', data);
};

exports.updateCustomer = updateCustomer;
exports.getInvoiceAccountData = getInvoiceAccountData;
