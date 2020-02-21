const { bookshelf } = require('./bookshelf.js');
const jsonColumns = require('bookshelf-json-columns');
bookshelf.plugin(jsonColumns);

module.exports = bookshelf.model('Event', {
  tableName: 'events',
  idAttribute: 'event_id',
  hasTimestamps: ['created', 'modified']
},
{
  jsonColumns: ['licences', 'entities', 'metaData']
});
