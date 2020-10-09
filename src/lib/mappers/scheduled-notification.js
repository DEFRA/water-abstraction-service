'use strict';

const ScheduledNotification = require('../models/scheduled-notification');

const dbToModel = dbRow => {
  const notification = new ScheduledNotification(dbRow.id);
  return notification.pickFrom(dbRow, [
    'recipient',
    'messageType',
    'messageRef',
    'personalisation'
  ]);
};

exports.dbToModel = dbToModel;
