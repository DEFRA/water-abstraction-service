'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('Region', {
  tableName: 'regions',

  hasTimestamps: ['date_created', 'date_updated']
});
