const chargeProcessor = require('./charge-processor');
const { omit } = require('lodash');
const { logger } = require('../../../logger');
const repository = require('../../../lib/connectors/repository');
const { Batch } = require('../../../lib/models');
const { assert } = require('@hapi/hoek');

/**
 * Given a Batch instance, writes all the invoices within the batch
 * to the water.billing_invoices table
 * @param {Batch} batch
 * @return {Promise} resolves when all records written
 */
const createBatchInvoices = batch => {
  assert(batch instanceof Batch, 'Batch expected');
  const data = batch.invoices.map(invoice => ({
    invoice_account_id: invoice.invoiceAccount.id,
    invoice_account_number: invoice.invoiceAccount.accountNumber,
    address: omit(invoice.address.toObject(), 'id'),
    billing_batch_id: batch.id
  }));
  const tasks = data.map(row => repository.billingInvoices.create(row));
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

  // Create batch and persist to DB
  return chargeProcessor.modelMapper(batchId, data);
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
