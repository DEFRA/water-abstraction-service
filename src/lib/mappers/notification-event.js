'use strict'
const { createMapper } = require('../object-mapper')
const { createModel } = require('./lib/helpers')

const NotificationEvent = require('../models/notification-event')
const ScheduledNotification = require('../models/scheduled-notification')
const { DISPLAY_STATUSES } = ScheduledNotification

const isErrorStatus = ({ status, notifyStatus }) =>
  ScheduledNotification.getDisplayStatus(status, notifyStatus) === DISPLAY_STATUSES.error

const getErrorCount = statuses => statuses
  ? statuses
    .filter(isErrorStatus)
    .reduce((acc, { count }) => acc + parseInt(count), 0)
  : null

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
  .map('statuses').to('errorCount', getErrorCount)

const dbToModel = row => createModel(NotificationEvent, row, dbToModelMapper)

exports.dbToModel = dbToModel
