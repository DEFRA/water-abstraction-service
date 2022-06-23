'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('BillingBatchChargeVersionYear', {
  idAttribute: 'billing_batch_charge_version_year_id',
  tableName: 'water.billing_batch_charge_version_years',
  hasTimestamps: ['date_created', 'date_updated'],

  billingBatch () {
    return this.belongsTo('BillingBatch', 'billing_batch_id', 'billing_batch_id')
  },

  chargeVersion () {
    return this.hasOne('ChargeVersion', 'charge_version_id', 'charge_version_id')
  }
})
