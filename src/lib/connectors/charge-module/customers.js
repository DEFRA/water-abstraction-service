'use strict';
const request = require('./request');
const { pickBy, identity } = require('lodash');
const { getInvoiceAccountById } = require('../../../lib/connectors/crm-v2/invoice-accounts');
const invoiceAccount = require('../../../lib/mappers/invoice-account');
const Invoice = require('../../../lib/models/invoice');

const getInvoiceAccountData = async (invoiceAccountId) => {
  const data = await getInvoiceAccountById(invoiceAccountId);

  const invoice = new Invoice();
  // Create invoice account model
  invoice.invoiceAccount = invoiceAccount.crmToModel(data);

  // Get last address from invoice account
  const { lastInvoiceAccountAddress } = invoice.invoiceAccount;
  const { address } = lastInvoiceAccountAddress;

  const response = {
    region: data.invoiceAccountNumber.charAt(0), // Region code is always assumed to be the first letter of the account number,
    customerReference: data.invoiceAccountNumber,
    customerName: data.company.name,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2,
    addressLine3: address.addressLine3,
    addressLine4: address.addressLine4,
    addressLine5: address.town, // Map town to address line 5 in CM
    addressLine6: address.county, // Map county to address line 5 in CM
    postcode: address.postcode
  };

  return pickBy(response, identity);
};

const updateCustomer = async invoiceAccountId => {
  const data = await getInvoiceAccountData(invoiceAccountId);
  return request.post('v1/wrls/customer_changes', data);
};

exports.updateCustomer = updateCustomer;
