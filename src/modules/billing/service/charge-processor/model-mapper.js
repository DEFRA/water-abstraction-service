/**
 * This maps the data output from the charge processor
 * to service models
 */
const { Batch, Invoice, InvoiceLicence, Licence } = require('../../../../lib/models');
const { uniqBy } = require('lodash');

const { mapCRMAddressToModel } = require('../../services/address-service');
const { mapCRMInvoiceAccountToModel } = require('../../services/invoice-accounts-service');
const { mapCRMCompanyToModel } = require('../../services/companies-service');
const { mapCRMContactToModel } = require('../../services/contacts-service');

/**
 * Maps a charge version from the charge processor to a Licence instance
 * @param {Object} chargeVersion
 * @return {Licence}
 */
const mapLicence = chargeVersion => {
  const licence = new Licence();
  licence.licenceNumber = chargeVersion.licenceRef;
  return licence;
};

/**
 * Maps a row of data from the charge processor to an InvoiceLicence instance
 * @param {Object} data - processed charge version
 * @return {InvoiceLicence}
 */
const mapInvoiceLicence = data => {
  const invoiceLicence = new InvoiceLicence();
  invoiceLicence.licence = mapLicence(data.chargeVersion);
  invoiceLicence.company = mapCRMCompanyToModel(data.licenceHolder.company);
  invoiceLicence.address = mapCRMAddressToModel(data.licenceHolder.address);
  if (data.licenceHolder.contact) {
    invoiceLicence.contact = mapCRMContactToModel(data.licenceHolder.contact);
  }
  return invoiceLicence;
};

const getInvoiceAccountNumber = row => row.invoiceAccount.invoiceAccount.invoiceAccountNumber;

/**
 * Maps output data from charge processor into an array of unique invoice licences
 * matching the invoice account number of the supplied Invoice instance
 * @param {Invoice} invoice - invoice instance
 * @param {Array} data - processed charge versions
 * @return {Array<InvoiceLicence>}
 */
const mapInvoiceLicences = (invoice, data) => {
  // Find rows with invoice account number that match the supplied invoice
  const { accountNumber } = invoice.invoiceAccount;
  const filtered = data.filter(row => getInvoiceAccountNumber(row) === accountNumber);
  // Create array of InvoiceLicences
  const invoiceLicences = filtered.map(mapInvoiceLicence);
  // @todo attach transactions to InvoiceLicences
  // Return a unique list
  return uniqBy(invoiceLicences, invoiceLicence => invoiceLicence.uniqueId);
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
    invoice.invoiceAccount = mapCRMInvoiceAccountToModel(row.invoiceAccount);

    // Create invoice address model
    invoice.address = mapCRMAddressToModel(row.address);

    // Create invoiceLicences array
    invoice.invoiceLicences = mapInvoiceLicences(invoice, data);

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
