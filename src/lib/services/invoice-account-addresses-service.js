'use strict';

const invoiceAccountsConnector = require('../connectors/crm-v2/invoice-accounts');
const invoiceAccountAddressesConnector = require('../connectors/crm-v2/invoice-account-addresses');
const mappers = require('../mappers');

/**
 * Creates a new invoice account address on the specified
 * invoice account
 *
 * @param {InvoiceAccount} invoiceAccount
 * @param {InvoiceAccountAddress} invoiceAccountAddress
 * @return {Promise<InvoiceAccountAddress}
 */
const createInvoiceAccountAddress = async (invoiceAccount, invoiceAccountAddress) => {
  const { address, agentCompany, contact, dateRange: { startDate } } = invoiceAccountAddress;
  const data = {
    addressId: address.id,
    startDate,
    agentCompanyId: agentCompany ? agentCompany.id : null,
    contactId: contact ? contact.id : null
  };

  const newInvoiceAccountAddress = await invoiceAccountsConnector.createInvoiceAccountAddress(invoiceAccount.id, data);
  return mappers.invoiceAccountAddress.crmToModel(newInvoiceAccountAddress);
};

/**
 * Deletes the specified invoice account address
 *
 * @param {String} invoiceAccountAddressId
 * @return {Promise}
 */
const deleteInvoiceAccountAddress = invoiceAccountAddressId =>
  invoiceAccountAddressesConnector.deleteInvoiceAccountAddress(invoiceAccountAddressId);

/**
 * Sets the end date of the invoice account address
 *
 * @param {String} invoiceAccountAddressId
 * @param {String} endDate
 * @return {Promise<Object>}
 */
const setEndDate = async (invoiceAccountAddressId, endDate) =>
  invoiceAccountAddressesConnector.patchInvoiceAccountAddress(invoiceAccountAddressId, { endDate });

exports.createInvoiceAccountAddress = createInvoiceAccountAddress;
exports.deleteInvoiceAccountAddress = deleteInvoiceAccountAddress;
exports.setEndDate = setEndDate;
