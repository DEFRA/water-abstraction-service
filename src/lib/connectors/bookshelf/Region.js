'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('Region', {
  tableName: 'water.regions',

  hasTimestamps: ['date_created', 'date_updated']
})
