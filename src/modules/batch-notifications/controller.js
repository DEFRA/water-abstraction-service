'use strict'

const Boom = require('@hapi/boom')
const { logger } = require('../../logger')

const configs = require('./config')

const { bookshelf } = require('../../lib/connectors/bookshelf')
const eventsService = require('../../lib/services/events')
const getRecipients = require('./lib/jobs/get-recipients')
const mapErrorResponse = require('../../lib/map-error-response')
const sendBatch = require('./lib/send-batch')
const scheduledNotificationsService = require('../../lib/services/scheduled-notifications')

const getByEventId = async (request, h) => scheduledNotificationsService.getByEventId(request.query.eventId)

/**
 * Prepares batch notification ready for sending
 * - Creates an event in the events table to describe the message
 * - Fires a Bull MQ event to prepare the messages ready for sending
 */
const postPrepare = async (request, h) => {
  const { messageType } = request.params
  const { issuer, data } = request.payload

  try {
    // Get message config based on message type
    const config = configs.find((o) => o.messageType === messageType)

    // Validate payload against schema defined in message config
    const { error } = config.schema.validate(data)
    if (error) {
      throw Boom.badRequest('Invalid payload', error)
    }

    // Check if the event record already exists with the same unique job id
    const eventAlreadyExists = await checkEventRecordExists(data.forms[0].uniqueJobId)

    if (eventAlreadyExists) {
      return {
        error: null,
        data: mapObjectToNew(eventAlreadyExists[0])
      }
    }

    // Create and persist event
    let ev = await config.createEvent(issuer, config, data)
    ev = await eventsService.create(ev)

    // Kick off BullMQ job to get recipients
    await request.queueManager.add(getRecipients.jobName, ev.id)

    // Return event details
    return {
      error: null,
      data: ev
    }
  } catch (err) {
    const code = err.output?.statusCode ?? 500
    logger.error('Batch notification preparation error', err.stack, { messageType, issuer, data })
    return h.response({
      error: err.message,
      data: null
    }).code(code)
  }
}

const mapObjectToNew = ({ event_id }) => ({ id: event_id })

const checkEventRecordExists = async (uniqueJobId) => {
  const record = await bookshelf
    .knex('events')
    .withSchema('water')
    .whereRaw("metadata->'options'->'forms'->0->'uniqueJobId'->>0 = ?", [uniqueJobId])

  return record.length === 0 ? false : record
}

/**
 * Starts the sending process by:
 * - Updating event status to 'sending'
 * - Updating all related messages to 'sending'
 * They are then picked up for further processing by the relevant cron jobs
 */
const postSend = async request => {
  const { eventId } = request.params
  const { issuer } = request.payload

  try {
    const event = await sendBatch.send(eventId, issuer)

    return { error: null, data: event }
  } catch (err) {
    logger.error('Batch notification send error', err.stack, { eventId })
    return mapErrorResponse(err)
  }
}

module.exports = {
  postPrepare,
  postSend,
  getByEventId
}
