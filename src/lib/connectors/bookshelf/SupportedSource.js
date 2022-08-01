'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('SupportedSource', {
  tableName: 'water.billing_supported_sources',

  hasTimestamps: ['date_created', 'date_updated']
})
