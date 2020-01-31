const chargeProcessor = require('./charge-processor');
const { logger } = require('../../../logger');
const { Batch } = require('../../../lib/models');
const { assert } = require('@hapi/hoek');

const batchService = require('../services/batch-service');
const invoiceService = require('../services/invoice-service');
const invoiceLicencesService = require('../services/invoice-licences-service');
const transactionsService = require('../services/transactions-service');

const mappers = require('../mappers');

const createInvoiceLicence = async (invoice, invoiceLicence) => {
  // Write water.billing_invoice_licences row and update model with ID
  const row = await invoiceLicencesService.saveInvoiceLicenceToDB(invoice, invoiceLicence);
  invoiceLicence.id = row.billing_invoice_licence_id;

  // Write transactions
  const tasks = invoiceLicence.transactions.map(transaction => {
    transactionsService.saveTransactionToDB(invoiceLicence, transaction);
  });

  return Promise.all(tasks);
};

const createBatchInvoice = async (batch, invoice) => {
  // Write water.billing_invoices
  const row = await invoiceService.saveInvoiceToDB(batch, invoice);

  // Update ID
  invoice.id = row.billing_invoice_id;

  // Write water.billing_invoice_licences
  const tasks = invoice.invoiceLicences.map(
    invoiceLicence => createInvoiceLicence(invoice, invoiceLicence)
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

  // Load batch and add invoices
  const batch = await batchService.getBatchById(batchId);
  const invoices = mappers.invoice.chargeToModels(data, batch);
  batch.addInvoices(invoices);

  return batch;
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
