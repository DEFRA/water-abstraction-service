const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('Event', {
  tableName: 'events',
  idAttribute: 'event_id'
});
