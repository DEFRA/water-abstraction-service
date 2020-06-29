const { BillingVolume, bookshelf } = require('../bookshelf');
const queries = require('./queries/billing-volumes');

/**
 * Create a new billing volume
 * @param {Object} data - camel case
 */
const create = async data => {
  const model = await BillingVolume
    .forge(data)
    .save();
  return model.toJSON();
};

/**
 * Gets billing volumes for charge elements and financial year
 * @param {Array<String>} ids - guids
 */
const findByChargeElementIdsAndFinancialYear = async (ids, financialYear) => {
  const result = await BillingVolume
    .forge()
    .query('whereIn', 'charge_element_id', ids)
    .where({ financial_year: financialYear })
    .fetchAll();

  return result.toJSON();
};

/**
 * Updates the record with the fields contained within changes object
 * @param {String} billingVolumeId
 * @param {Object} changes
 */
const update = async (billingVolumeId, changes) => {
  const result = await BillingVolume.forge({ billingVolumeId }).save(changes);
  return result.toJSON();
};

/**
 * Gets billing volumes for a given batchId where the isApproved flag = flase
 * @param {String} batchId
 */
const getUnapprovedVolumesForBatch = async batchId => {
  const result = await BillingVolume
    .forge()
    .where({ billing_batch_id: batchId, is_approved: false })
    .fetchAll();

  return result.toJSON();
};

const findByBatchId = async batchId => {
  const result = await BillingVolume
    .forge()
    .where({ billing_batch_id: batchId })
    .fetchAll();

  return result.toJSON();
};

/**
 * Deletes all billing volumes for given batch
 * @param {String} batchId - guid
 */
const deleteByBatchId = async batchId => BillingVolume
  .forge()
  .where({ billing_batch_id: batchId })
  .destroy();

/**
* Deletes all billing volumes related to invoice licence
* @param {String} invoiceLicenceId - guid
* @param {String} batchId - guid
*/
// @TODO: Check if this works as expected when functionality to delete invoices by financial year
const deleteByInvoiceLicenceAndBatchId = async (invoiceLicenceId, batchId) =>
  bookshelf.knex.raw(queries.deleteByInvoiceLicenceAndBatchId, { invoiceLicenceId, batchId });

/**
* Deletes all billing volumes for given invoice account and batch
* @param {String} batchId - guid
* @param {String} invoiceAccountId - guid
*/
const deleteByBatchAndInvoiceId = async (batchId, billingInvoiceId) =>
  bookshelf.knex.raw(queries.deleteByBatchAndInvoiceId, { batchId, billingInvoiceId });

exports.create = create;
exports.findByChargeElementIdsAndFinancialYear = findByChargeElementIdsAndFinancialYear;
exports.update = update;
exports.getUnapprovedVolumesForBatch = getUnapprovedVolumesForBatch;
exports.findByBatchId = findByBatchId;
exports.deleteByBatchId = deleteByBatchId;
exports.deleteByInvoiceLicenceAndBatchId = deleteByInvoiceLicenceAndBatchId;
exports.deleteByBatchAndInvoiceId = deleteByBatchAndInvoiceId;
