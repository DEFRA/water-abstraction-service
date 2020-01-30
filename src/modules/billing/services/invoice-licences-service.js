const { get } = require('lodash');

const repos = require('../../../lib/connectors/repository');

const Licence = require('../../../lib/models/licence');
const InvoiceLicence = require('../../../lib/models/invoice-licence');

const { mapCRMAddressToModel } = require('./address-service');
const { mapCRMCompanyToModel } = require('./companies-service');
const { mapCRMContactToModel } = require('./contacts-service');
const { mapChargeToTransactions } = require('./transactions-service');

/**
 * Maps a charge version from the charge processor to a Licence instance
 * @param {Object} chargeVersion
 * @return {Licence}
 */
const mapLicence = chargeVersion => {
  const licence = new Licence();
  licence.fromHash({
    id: chargeVersion.licenceId,
    licenceNumber: chargeVersion.licenceRef
  });
  return licence;
};

/**
 * Maps a row of data from the charge processor to an InvoiceLicence instance
 * @param {Object} data - processed charge version
 * @return {InvoiceLicence}
 */
const mapChargeRowToModel = (data, batch) => {
  const invoiceLicence = new InvoiceLicence();
  invoiceLicence.licence = mapLicence(data.chargeVersion);
  invoiceLicence.company = mapCRMCompanyToModel(data.licenceHolder.company);
  invoiceLicence.address = mapCRMAddressToModel(data.licenceHolder.address);
  if (data.licenceHolder.contact) {
    invoiceLicence.contact = mapCRMContactToModel(data.licenceHolder.contact);
  }

  invoiceLicence.transactions = mapChargeToTransactions(data, batch);
  return invoiceLicence;
};

/**
 * Maps data from an InvoiceLicence model to the correct shape for water.billing_invoice_licences
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Object}
 */
const mapModelToDB = (invoice, invoiceLicence) => {
  // Map data to new row in water.billing_invoice_licences
  // @todo - it feels odd here writing either a contact or a company object
  // suggest we expand the table to include company and contact fields and write both separately
  const licenceHolder = invoiceLicence.contact ? invoiceLicence.contact.toJSON() : invoiceLicence.company.toJSON();

  return {
    billing_invoice_id: invoice.id,
    company_id: invoiceLicence.company.id,
    contact_id: get(invoiceLicence, 'contact.id', null),
    address_id: invoiceLicence.address.id,
    licence_ref: invoiceLicence.licence.licenceNumber,
    licence_holder_name: licenceHolder,
    licence_holder_address: invoiceLicence.address.toObject(),
    licence_id: invoiceLicence.licence.id
  };
};

/**
 * Saves an Invoice model to water.billing_invoices
 * @param {Invoice} invoice
 * @param {InvoiceLicence} invoiceLicence
 * @return {Promise<Object>} row data inserted
 */
const saveInvoiceLicenceToDB = async (invoice, invoiceLicence) => {
  const data = mapModelToDB(invoice, invoiceLicence);
  const { rows: [row] } = await repos.billingInvoiceLicences.create(data);
  return row;
};

exports.mapChargeRowToModel = mapChargeRowToModel;
exports.saveInvoiceLicenceToDB = saveInvoiceLicenceToDB;
