'use strict';

const chargeProcessor = require('./charge-processor');
const { logger } = require('../../../logger');
const { Batch } = require('../../../lib/models');
const { assert } = require('@hapi/hoek');

const batchService = require('../services/batch-service');

const mappers = require('../mappers');

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
const persistChargeVersionYearBatch = batch => {
  assert(batch instanceof Batch, 'Batch expected');
  await batchService.saveInvoicesToDB(batch);
};

exports.createBatchFromChargeVersionYear = createBatchFromChargeVersionYear;
exports.persistChargeVersionYearBatch = persistChargeVersionYearBatch;
