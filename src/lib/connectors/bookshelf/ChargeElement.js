'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ChargeElement', {
  tableName: 'charge_elements',

  hasTimestamps: ['date_created', 'date_updated']
});
