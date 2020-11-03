'use strict';

const ScheduledNotification = require('../models/scheduled-notification');

const dbToModel = dbRow => {
  const notification = new ScheduledNotification(dbRow.id);
  return notification.pickFrom(dbRow, [
    'recipient',
    'messageType',
    'messageRef',
    'personalisation',
    'eventId',
    'licences',
    'status',
    'notifyStatus'
  ]);
};

const modelToDb = scheduledNotification => {
  return scheduledNotification.pick([
    'id',
    'recipient',
    'messageRef',
    'messageType',
    'personalisation',
    'eventId',
    'licences',
    'status',
    'notifyStatus'
  ]);
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
