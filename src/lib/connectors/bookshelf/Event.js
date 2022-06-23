const { bookshelf } = require('./bookshelf.js')

module.exports = bookshelf.model('Event', {

  tableName: 'water.events',

  idAttribute: 'event_id',

  hasTimestamps: ['created', 'modified']

},
{
  jsonColumns: ['licences', 'entities', 'metadata']
})
