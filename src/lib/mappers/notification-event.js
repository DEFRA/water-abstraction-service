'use strict';
const { createMapper } = require('../object-mapper');
const { createModel } = require('./lib/helpers');

const NotificationEvent = require('../models/notification-event');
const { MESSAGE_STATUSES, NOTIFY_STATUSES } = require('../models/scheduled-notification');

const errorStatuses = [
  MESSAGE_STATUSES.error,
  NOTIFY_STATUSES.permanentFailure,
  NOTIFY_STATUSES.technicalFailure,
  NOTIFY_STATUSES.temporaryFailure,
  NOTIFY_STATUSES.validationFailure,
  NOTIFY_STATUSES.error
];

const getErrorCount = statuses => statuses
  ? statuses.reduce((acc, { count, status }) =>
    acc + (errorStatuses.includes(status) ? count : 0)
  , 0)
  : null;

const dbToModelMapper = createMapper()
  .map('eventId').to('id')
  .copy(
    'recipientCount',
    'issuer',
    'type',
    'subtype',
    'metadata',
    'created',
    'modified',
    'referenceCode'
  )
  .map('statuses').to('errorCount', getErrorCount);

const dbToModel = row => createModel(NotificationEvent, row, dbToModelMapper);

exports.dbToModel = dbToModel;
