'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('BillingInvoice', {
  tableName: 'water.billing_invoices',

  hasTimestamps: ['date_created', 'date_updated'],

  idAttribute: 'billing_invoice_id',

  billingBatch () {
    return this.belongsTo('BillingBatch', 'billing_batch_id', 'billing_batch_id')
  },

  billingInvoiceLicences () {
    return this.hasMany('BillingInvoiceLicence', 'billing_invoice_id', 'billing_invoice_id')
  },

  linkedBillingInvoices () {
    return this.hasMany('BillingInvoice', 'original_billing_invoice_id', 'original_billing_invoice_id')
  },

  originalBillingInvoice () {
    return this.hasOne('BillingInvoice', 'billing_invoice_id', 'original_billing_invoice_id')
  }
})
