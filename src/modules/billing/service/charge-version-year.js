const chargeProcessor = require('./charge-processor');
const { get } = require('lodash');
const { logger } = require('../../../logger');
const repository = require('../../../lib/connectors/repository');
const { Batch } = require('../../../lib/models');
const { assert } = require('@hapi/hoek');

const batchService = require('../services/batch-service');
const invoiceService = require('../services/invoice-service');

const createBatchInvoiceLicence = async (billingInvoiceId, invoiceLicence) => {
  const { licenceNumber } = invoiceLicence.licence;

  // Fetch licence id
  const licence = await repository.licences.findOneByLicenceNumber(licenceNumber);

  if (!licence) {
    throw new Error(`Licence ${licenceNumber} not found`);
  }

  // Map data to new row in water.billing_invoice_licences
  // @todo - it feels odd here writing either a contact or a company object
  // suggest we expand the table to include company and contact fields and write both separately
  const licenceHolder = invoiceLicence.contact ? invoiceLicence.contact.toJSON() : invoiceLicence.company.toJSON();
  const row = {
    billing_invoice_id: billingInvoiceId,
    company_id: invoiceLicence.company.id,
    contact_id: get(invoiceLicence, 'contact.id', null),
    address_id: invoiceLicence.address.id,
    licence_ref: invoiceLicence.licence.licenceNumber,
    licence_holder_name: licenceHolder,
    licence_holder_address: invoiceLicence.address.toObject(),
    licence_id: licence.licence_id
  };

  // Persist to DB
  return repository.billingInvoiceLicences.create(row);
};

const createBatchInvoice = async (batch, invoice) => {
  // Write water.billing_invoices
  const row = await invoiceService.saveInvoiceToDB(batch, invoice);

  // Write water.billing_invoice_licences
  const tasks = invoice.invoiceLicences.map(invoiceLicence =>
    createBatchInvoiceLicence(row.billing_invoice_id, invoiceLicence)
  );

  return Promise.all(tasks);
};

/**
 * Given a Batch instance, writes all the invoices within the batch
 * to the water.billing_invoices table
 * @param {Batch} batch
 * @return {Promise} resolves when all records written
 */
const createBatchInvoices = batch => {
  assert(batch instanceof Batch, 'Batch expected');
  const tasks = batch.invoices.map(row => createBatchInvoice(batch, row));
  return Promise.all(tasks);
};

/**
 * Given a charge version year record from the water.billing_batch_charge_version_years,
 * processes the charge version for that year, and then populates a Batch model with
 * related entities ready for persistence to DB
 * @param {Object} chargeVersionYear
 * @return {Batch}
 */
const createBatchFromChargeVersionYear = async chargeVersionYear => {
  const {
    charge_version_id: chargeVersionId,
    financial_year_ending: financialYearEnding,
    billing_batch_id: batchId
  } = chargeVersionYear;

  // Process charge data
  const { error, data } = await chargeProcessor.processCharges(financialYearEnding, chargeVersionId);

  if (error) {
    const err = new Error(error);
    logger.error(error, err, { chargeVersionYear });
    throw err;
  }

  // Create Batch instance
  return batchService.mapChargeDataToModel(batchId, data);
};

/**
 * Saves a batch for a charge version year to the DB
 * @param {Batch} batch
 * @return {Promise}
 */
const persistChargeVersionYearBatch = async batch => {
  assert(batch instanceof Batch, 'Batch expected');
  await createBatchInvoices(batch);
};

exports.createBatchFromChargeVersionYear = createBatchFromChargeVersionYear;
exports.persistChargeVersionYearBatch = persistChargeVersionYearBatch;
