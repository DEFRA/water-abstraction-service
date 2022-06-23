'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('BillingInvoiceLicence', {
  tableName: 'water.billing_invoice_licences',
  idAttribute: 'billing_invoice_licence_id',
  hasTimestamps: ['date_created', 'date_updated'],
  requireFetch: false,

  billingInvoice () {
    return this.belongsTo('BillingInvoice', 'billing_invoice_id', 'billing_invoice_id')
  },

  billingTransactions () {
    return this.hasMany('BillingTransaction', 'billing_invoice_licence_id', 'billing_invoice_licence_id')
  },

  licence () {
    return this.hasOne('Licence', 'licence_id', 'licence_id')
  }
})
