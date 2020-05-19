const { BillingBatch, bookshelf } = require('../../../src/lib/connectors/bookshelf');
const queries = require('./queries/batches');

/**
 * Gets batch with related data by ID
 * @param {String} billingBatchId
 * @return {Promise}
 */
const getBatchById = billingBatchId =>
  BillingBatch
    .forge({ billingBatchId })
    .fetch({
      withRelated: [
        'billingInvoices',
        'billingInvoices.billingInvoiceLicences',
        'billingInvoices.billingInvoiceLicences.billingTransactions'
      ]
    });

const tearDown = async () => {
  await bookshelf.knex.raw(queries.deleteBillingTransactions);
  await bookshelf.knex.raw(queries.deleteBillingInvoiceLicences);
  await bookshelf.knex.raw(queries.deleteBillingInvoices);
  await bookshelf.knex.raw(queries.deleteBillingBatchChargeVersionYears);
  await bookshelf.knex.raw(queries.deleteBillingBatchChargeVersions);
  await bookshelf.knex.raw(queries.deleteBillingBatches);
};

exports.getBatchById = getBatchById;
exports.tearDown = tearDown;
