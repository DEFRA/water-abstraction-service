'use strict';

const InvoiceAccountAddress = require('../models/invoice-account-address');
const invoiceAccountsConnector = require('../connectors/crm-v2/invoice-accounts');
const invoiceAccountAddressesConnector = require('../connectors/crm-v2/invoice-account-addresses');
const mappers = require('../mappers');
const DateRange = require('../models/date-range');

const getInvoiceAccountAddressModel = (startDate, addressModel, agentCompanyModel, contactModel) => {
  const invoiceAccountAddress = new InvoiceAccountAddress();
  return invoiceAccountAddress.fromHash({
    dateRange: new DateRange(startDate, null),
    address: addressModel,
    agentCompany: agentCompanyModel,
    contact: contactModel
  });
};

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

exports.getInvoiceAccountAddressModel = getInvoiceAccountAddressModel;
exports.createInvoiceAccountAddress = createInvoiceAccountAddress;
exports.deleteInvoiceAccountAddress = deleteInvoiceAccountAddress;
exports.setEndDate = setEndDate;
