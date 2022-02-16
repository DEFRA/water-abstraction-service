'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ChargeElement', {
  tableName: 'water.charge_elements',

  hasTimestamps: ['date_created', 'date_updated'],

  purposePrimary () {
    return this.hasOne('PurposePrimary', 'purpose_primary_id', 'purpose_primary_id');
  },

  purposeSecondary () {
    return this.hasOne('PurposeSecondary', 'purpose_secondary_id', 'purpose_secondary_id');
  },

  purposeUse () {
    return this.hasOne('PurposeUse', 'purpose_use_id', 'purpose_use_id');
  },
/*
  chargePurposes () {
    return this.hasMany('ChargePurpose', 'charge_element_id', 'charge_element_id');
  },

  chargeCategory () {
    return this.hasOne('ChargeCategory', 'billing_charge_category_id', 'billing_charge_category_id');
  }*/
});
