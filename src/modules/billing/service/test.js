const service = require('./');
const { omit } = require('lodash');
const logger = require('../../../logger');
const repository = require('../../../lib/connectors/repository/');
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

// To-do:
// Load charge version
// Load licence docs versions from API
// Loop through and create invoices
const initialiseFromChargeVersionYear = async chargeVersionYear => {
  const {
    charge_version_id: chargeVersionId,
    financial_year_ending: financialYearEnding
  } = chargeVersionYear;

  // Process charge data
  const { error, data } = await service.chargeProcessor(financialYearEnding, chargeVersionId);

  if (error) {
    const msg = 'Error processing charge version year';
    logger.error(msg, chargeVersionYear);
    throw new Error(msg);
  }

  // Create batch and persist to DB
  const batch = service.chargeProcessor.modelMapper(chargeVersionYear.billing_batch_id, data);
  await createBatchInvoices(batch);
};

initialiseFromChargeVersionYear({
  billing_batch_charge_version_year_id: '944dc076-a034-4845-991e-28f64fe1f8c4',
  billing_batch_id: '7b844a49-b11e-431c-910a-c188995c989d',
  charge_version_id: '980293d0-c0fe-4a77-b676-141d4c085eda',
  financial_year_ending: 2018,
  status: 'processing'
});
