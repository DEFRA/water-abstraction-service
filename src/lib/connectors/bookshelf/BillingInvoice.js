'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('BillingInvoice', {
  tableName: 'billing_invoices',

  hasTimestamps: ['date_created', 'date_updated'],

  billingBatch () {
    return this.hasOne('BillingBatch', 'billing_batch_id', 'billing_batch_id');
  },

  billingInvoiceLicences () {
    return this.hasMany('BillingInvoiceLicence', 'billing_invoice_id', 'billing_invoice_id');
  }
});
