'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('PurposeSecondary', {
  tableName: 'purposes_secondary',

  idAttribute: 'id',

  hasTimestamps: ['date_created', 'date_updated']
});
