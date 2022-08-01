'use strict'

const { createMapper } = require('../object-mapper')
const ScheduledNotification = require('../models/scheduled-notification')
const eventMapper = require('./event')
const helpers = require('./lib/helpers')

const dbToModelMapper = createMapper()
  .copy(
    'id',
    'recipient',
    'messageType',
    'messageRef',
    'personalisation',
    'eventId',
    'licences',
    'status',
    'notifyId',
    'notifyStatus'
  )
  .map('event').to('event', eventMapper.dbToModel)

const dbToModel = data => helpers.createModel(ScheduledNotification, data, dbToModelMapper)

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
    'notifyId',
    'notifyStatus'
  ])
}

exports.dbToModel = dbToModel
exports.modelToDb = modelToDb
