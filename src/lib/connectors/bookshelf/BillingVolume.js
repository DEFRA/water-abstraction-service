'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('BillingVolume', {
  tableName: 'billing_volumes',

  idAttribute: 'billing_volume_id',

  billingTransaction () {
    return this.belongsTo('BillingTransaction', 'charge_element_id', 'charge_element_id');
  },

  billingBatch () {
    return this.belongsTo('BillingBatch', 'billing_batch_id', 'billing_batch_id');
  },

  chargeElement () {
    return this.belongsTo('ChargeElement', 'charge_element_id', 'charge_element_id');
  }
});
