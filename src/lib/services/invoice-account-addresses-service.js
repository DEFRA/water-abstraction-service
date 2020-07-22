const InvoiceAccountAddress = require('../models/invoice-account-address');
const invoiceAccountsConnector = require('../connectors/crm-v2/invoice-accounts');
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

const createInvoiceAccountAddress = async (invoiceAccount, startDate) => {
  const { address, agentCompany, contact } = invoiceAccount.invoiceAccountAddresses[0];
  const data = {
    addressId: address.id,
    startDate,
    agentCompanyId: agentCompany ? agentCompany.id : null,
    contactId: contact ? contact.id : null
  };

  const invoiceAccountAddress = await invoiceAccountsConnector.createInvoiceAccountAddress(invoiceAccount.id, data);
  invoiceAccount.invoiceAccountAddresses[0].id = invoiceAccountAddress.invoiceAccountAddressId;
};

const deleteInvoiceAccountAddress = async invoiceAccountAddress =>
  invoiceAccountsConnector.deleteInvoiceAccountAddress(invoiceAccountAddress.invoiceAccountId, invoiceAccountAddress.id);

exports.getInvoiceAccountAddressModel = getInvoiceAccountAddressModel;
exports.createInvoiceAccountAddress = createInvoiceAccountAddress;
exports.deleteInvoiceAccountAddress = deleteInvoiceAccountAddress;
