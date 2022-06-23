'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('PurposeUse', {
  tableName: 'water.purposes_uses',

  idAttribute: 'purpose_use_id',

  hasTimestamps: ['date_created', 'date_updated']
})
