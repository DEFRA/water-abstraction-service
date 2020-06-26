'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('BillingBatchChargeVersion', {
  tableName: 'billing_batch_charge_versions',

  hasTimestamps: ['date_created', 'date_updated'],

  idAttribute: 'billing_batch_charge_version_id',

  billingBatch () {
    return this.belongsTo('BillingBatch', 'billing_batch_id', 'billing_batch_id');
  },

  chargeVersion () {
    return this.hasOne('ChargeVersion', 'charge_version_id', 'charge_version_id');
  }
});
