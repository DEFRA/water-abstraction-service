'use strict'

const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('Note', {
  tableName: 'water.notes',

  hasTimestamps: ['date_created', 'date_updated']
})
