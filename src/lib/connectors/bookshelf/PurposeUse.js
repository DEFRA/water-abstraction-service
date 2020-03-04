'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('PurposeUse', {
  tableName: 'purposes_uses',

  idAttribute: 'id',

  hasTimestamps: ['date_created', 'date_updated']
});
