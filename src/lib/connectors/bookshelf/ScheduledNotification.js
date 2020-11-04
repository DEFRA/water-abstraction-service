'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ScheduledNotification', {

  tableName: 'scheduled_notification',

  hasTimestamps: ['date_created'],

  idAttribute: 'id'

}, {
  jsonColumns: ['licences']
});
