'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('PurposeSecondary', {
  tableName: 'water.purposes_secondary',

  idAttribute: 'purpose_secondary_id',

  hasTimestamps: ['date_created', 'date_updated']
})
