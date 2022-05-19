'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('BillingTransaction', {
  tableName: 'water.billing_transactions',

  idAttribute: 'billing_transaction_id',

  hasTimestamps: ['date_created', 'date_updated'],

  billingInvoiceLicence () {
    return this.hasOne('BillingInvoiceLicence', 'billing_invoice_licence_id', 'billing_invoice_licence_id')
  },

  chargeElement () {
    return this.hasOne('ChargeElement', 'charge_element_id', 'charge_element_id')
  },

  billingVolume () {
    return this.hasMany('BillingVolume', 'charge_element_id', 'charge_element_id')
  }
})
