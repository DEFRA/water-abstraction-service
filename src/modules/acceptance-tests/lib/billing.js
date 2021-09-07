const { bookshelf } = require('../../../lib/connectors/bookshelf');
const queries = require('./queries/billing');

const tearDown = async () => {
  await bookshelf.knex.raw(queries.deleteBillingTransactions);
  await bookshelf.knex.raw(queries.deleteBillingVolumes);
  await bookshelf.knex.raw(queries.deleteBillingInvoiceLicences);
  await bookshelf.knex.raw(queries.deleteBillingInvoices);
  await bookshelf.knex.raw(queries.deleteBillingBatchChargeVersionYears);
  await bookshelf.knex.raw(queries.deleteBillingBatches);
};

exports.tearDown = tearDown;
