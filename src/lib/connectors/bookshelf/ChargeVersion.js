'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ChargeVersion', {
  tableName: 'charge_versions',

  hasTimestamps: ['date_created', 'date_updated'],

  idAttribute: 'charge_version_id',

  chargeElements () {
    return this.hasMany('ChargeElement', 'charge_version_id', 'charge_version_id');
  }
});
