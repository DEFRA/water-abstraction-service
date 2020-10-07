'use strict';

const { bookshelf } = require('./bookshelf.js');

module.exports = bookshelf.model('ScheduledNotification', {

  tableName: 'scheduled_notification',

  idAttribute: 'id'
});
