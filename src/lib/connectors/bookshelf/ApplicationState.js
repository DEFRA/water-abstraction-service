'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('ApplicationState', {
  tableName: 'water.application_state',

  idAttribute: 'application_state_id',

  hasTimestamps: ['date_created', 'date_updated'],

  requireFetch: false,

  jsonColumns: ['data']
})
