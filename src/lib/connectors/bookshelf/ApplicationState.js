'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ApplicationState', {
  tableName: 'application_state',

  idAttribute: 'application_state_id',

  hasTimestamps: ['date_created', 'date_updated'],

  requireFetch: false
});
