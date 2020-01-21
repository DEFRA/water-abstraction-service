const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('BillingInvoice', {
  tableName: 'billing_invoices',

  billingBatch () {
    return this.hasOne('BillingBatch', 'billing_batch_id', 'billing_batch_id');
  },

  billingInvoiceLicences () {
    return this.hasMany('BillingInvoiceLicence', 'billing_invoice_id', 'billing_invoice_id');
  }
});
