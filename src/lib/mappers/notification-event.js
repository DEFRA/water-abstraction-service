'use strict';

const NotificationEvent = require('../models/notification-event');
const { MESSAGE_STATUSES, NOTIFY_STATUSES } = require('../models/scheduled-notification');

const errorStatuses = [
  MESSAGE_STATUSES.error,
  NOTIFY_STATUSES.permanentFailure,
  NOTIFY_STATUSES.technicalFailure,
  NOTIFY_STATUSES.temporaryFailure,
  NOTIFY_STATUSES.validationFailure
];

const getErrorCount = statuses => (statuses || []).reduce((acc, { count, status }) =>
  acc + errorStatuses.includes(status) ? count : 0
, 0);

const dbToModel = row => {
  const { eventId, statuses, ...rest } = row;
  const errorCount = getErrorCount(statuses);
  return new NotificationEvent(eventId).fromHash({
    errorCount,
    ...rest
  });
};

exports.dbToModel = dbToModel;
