'use strict';

const { get } = require('lodash');

const Address = require('../../../lib/models/address');
const Company = require('../../../lib/models/company');
const Contact = require('../../../lib/models/contact-v2');

const InvoiceLicence = require('../../../lib/models/invoice-licence');
const Licence = require('../../../lib/models/licence');

// Mappers
const address = require('./address');
const company = require('./company');
const contact = require('./contact');
const transaction = require('./transaction');

/**
 * Maps a row of data from water.billing_invoice_licences
 * to an InvoiceLicence model
 * @param {Object} row - camel cased
 * @return {InvoiceLicence}
 */
const dbToModel = row => {
  const invoiceLicence = new InvoiceLicence(row.billingInvoiceLicenceId);

  // @todo suggest we serialise company, address and contact to jsonb fields in table
  invoiceLicence.company = new Company(row.companyId);
  invoiceLicence.address = new Address(row.addressId);
  if (row.contactId) {
    invoiceLicence.contact = new Contact(row.contactId);
  }
  return invoiceLicence;
};

/**
 * Maps data from an InvoiceLicence model to the correct shape for water.billing_invoice_licences
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Object}
 */
const modelToDb = (invoice, invoiceLicence) => {
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
const chargeToModel = (data, batch) => {
  const invoiceLicence = new InvoiceLicence();
  invoiceLicence.licence = mapLicence(data.chargeVersion);
  invoiceLicence.company = company.crmToModel(data.licenceHolder.company);
  invoiceLicence.address = address.crmToModel(data.licenceHolder.address);
  if (data.licenceHolder.contact) {
    invoiceLicence.contact = contact.crmToModel(data.licenceHolder.contact);
  }
  invoiceLicence.transactions = transaction.chargeToModels(data, batch);
  return invoiceLicence;
};

exports.dbToModel = dbToModel;
exports.modelToDB = modelToDb;
exports.chargeToModel = chargeToModel;
