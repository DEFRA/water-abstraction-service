const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('Event', {

  tableName: 'water.events',

  idAttribute: 'event_id',

  hasTimestamps: ['created', 'modified'],

  scheduledNotifications () {
    return this.hasMany('ScheduledNotification', 'event_id', 'event_id');
  }

},
{
  jsonColumns: ['licences', 'entities', 'metadata']
});
