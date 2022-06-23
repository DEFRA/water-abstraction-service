'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('ChangeReason', {
  tableName: 'water.change_reasons',

  idAttribute: 'change_reason_id',

  hasTimestamps: ['date_created', 'date_updated'],

  requireFetch: false

})
