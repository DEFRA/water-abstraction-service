const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('BillingBatch', {
  tableName: 'billing_batches',
  billingInvoices () {
    return this.hasMany('BillingInvoice', 'billing_batch_id', 'billing_batch_id');
  }
});
