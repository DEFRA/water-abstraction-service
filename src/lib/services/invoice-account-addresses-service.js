const InvoiceAccountAddress = require('../models/invoice-account-address');
const invoiceAccountsConnector = require('../connectors/crm-v2/invoice-accounts');
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

const deleteInvoiceAccountAddress = async invoiceAccountAddress =>
  invoiceAccountsConnector.deleteInvoiceAccountAddress(invoiceAccountAddress.invoiceAccountId, invoiceAccountAddress.id);

exports.getInvoiceAccountAddressModel = getInvoiceAccountAddressModel;
exports.createInvoiceAccountAddress = createInvoiceAccountAddress;
exports.deleteInvoiceAccountAddress = deleteInvoiceAccountAddress;
