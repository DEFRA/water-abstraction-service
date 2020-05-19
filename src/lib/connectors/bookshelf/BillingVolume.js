'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('BillingVolume', {
  tableName: 'billing_volumes',

  idAttribute: 'billing_volume_id',

  chargeElement () {
    return this.belongsTo('ChargeElement', 'charge_element_id', 'charge_element_id');
  }
});
