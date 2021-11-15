'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ChargeCategory', {
  tableName: 'water.billing_charge_categories',

  hasTimestamps: ['date_created', 'date_updated']
});
