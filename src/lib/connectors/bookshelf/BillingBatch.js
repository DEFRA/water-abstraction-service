'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('BillingBatch', {
  tableName: 'water.billing_batches',

  idAttribute: 'billing_batch_id',

  hasTimestamps: ['date_created', 'date_updated'],

  requireFetch: false,

  billingInvoices () {
    return this.hasMany('BillingInvoice', 'billing_batch_id', 'billing_batch_id')
  },

  region () {
    return this.hasOne('Region', 'region_id', 'region_id')
  }
})
