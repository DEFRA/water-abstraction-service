'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('PurposePrimary', {
  tableName: 'purposes_primary',

  idAttribute: 'purpose_primary_id',

  hasTimestamps: ['date_created', 'date_updated']
});
