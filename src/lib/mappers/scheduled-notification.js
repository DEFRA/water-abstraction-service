'use strict';

const ScheduledNotification = require('../models/scheduled-notification');

const dbToModel = dbRow => {
  const notification = new ScheduledNotification(dbRow.id);
  return notification.pickFrom(dbRow, [
    'recipient',
    'messageType',
    'messageRef',
    'personalisation',
    'eventId'
  ]);
};

const modelToDb = scheduledNotification => {
  return scheduledNotification.pick([
    'id',
    'recipient',
    'messageRef',
    'messageType',
    'personalisation',
    'eventId'
  ]);
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
