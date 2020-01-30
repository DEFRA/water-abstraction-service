const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('BillingBatch', {
  tableName: 'billing_batches',
  idAttribute: 'billing_batch_id',
  billingInvoices () {
    return this.hasMany('BillingInvoice', 'billing_batch_id', 'billing_batch_id');
  },
  region () {
    return this.hasOne('Region', 'region_id', 'region_id');
  }
});
