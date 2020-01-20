const { bookshelf } = require('../../../connectors/bookshelf');

module.exports = bookshelf.model('BillingInvoice', {
  tableName: 'billing_invoices',
  idAttribute: 'billing_invoice_id',

  billingBatch () {
    return this.hasOne('BillingBatch', 'billing_batch_id', 'billing_batch_id');
  },

  billingInvoiceLicences () {
    return this.hasMany('BillingInvoiceLicence', 'billing_invoice_id', 'billing_invoice_id');
  }
});
