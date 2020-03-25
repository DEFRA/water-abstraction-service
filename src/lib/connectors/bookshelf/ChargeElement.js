'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ChargeElement', {
  tableName: 'charge_elements',

  hasTimestamps: ['date_created', 'date_updated'],

  purposePrimary () {
    return this.hasOne('PurposePrimary', 'id', 'purpose_primary');
  },

  purposeSecondary () {
    return this.hasOne('PurposeSecondary', 'id', 'purpose_secondary');
  },

  purposeUse () {
    return this.hasOne('PurposeUse', 'id', 'purpose_tertiary');
  }
});
