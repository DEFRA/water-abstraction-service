'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('PurposePrimary', {
  tableName: 'purposes_primary',

  idAttribute: 'id',

  hasTimestamps: ['date_created', 'date_updated']
});
