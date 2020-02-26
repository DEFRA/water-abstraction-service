'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ChargeVersionYear', {
  idAttribute: 'billing_batch_charge_version_year_id',
  tableName: 'billing_batch_charge_version_years',
  hasTimestamps: ['date_created', 'date_updated']
});
