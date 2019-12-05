/**
 * This maps the data output from the charge processor
 * to service models
 */
const { Address, Batch, Invoice, InvoiceAccount } = require('../../../../lib/models');
const { uniqBy } = require('lodash');

/**
 * Maps address data from CRM to water service Address model
 * @param {Object} data - address data from CRM
 * @return {Address}
 */
const mapAddress = data => {
  const address = new Address();
  address.id = data.addressId;
  address.addressLine1 = data.address1;
  address.addressLine2 = data.address2;
  address.addressLine3 = data.address3;
  address.addressLine4 = data.address4;
  address.town = data.town;
  address.county = data.county;
  address.postcode = data.postcode;
  address.country = data.country;
  return address;
};

const mapInvoiceAccount = data => {
  const invoiceAccount = new InvoiceAccount();
  invoiceAccount.id = data.invoiceAccountId;
  invoiceAccount.accountNumber = data.invoiceAccountNumber;
  return invoiceAccount;
};

const mapInvoices = data => {
  // Create unique list of invoice accounts within data
  const rows = uniqBy(
    data.map(row => row.invoiceAccount),
    row => row.invoiceAccount.invoiceAccountId
  );

  // Map to invoice models
  return rows.map(row => {
    const invoice = new Invoice();

    // Create invoice account model
    invoice.invoiceAccount = mapInvoiceAccount(row.invoiceAccount);

    // Create invoice address model
    invoice.address = mapAddress(row.address);

    return invoice;
  });
};

/**
 * Maps the charge data to water service models ready for use
 * within this service
 * @param {String} batchId - the guid batch ID in water.billing_batches
 * @param {Array} data - array of data from charge processor
 * @return {Batch} water Batch instance
 */
const modelMapper = (batchId, data) => {
  // Create batch
  const batch = new Batch();
  batch.id = batchId;

  // Add invoices to batch
  batch.addInvoices(mapInvoices(data));

  return batch;
};

exports.modelMapper = modelMapper;
