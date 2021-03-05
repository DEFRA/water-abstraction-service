'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ScheduledNotification', {

  tableName: 'water.scheduled_notification',

  hasTimestamps: ['date_created'],

  idAttribute: 'id'

}, {
  jsonColumns: ['licences']
});
