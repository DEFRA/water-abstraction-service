'use strict'

const generateReference = require('../../../lib/reference-generator')
const {
  EVENT_STATUS_PROCESSING, EVENT_STATUS_PROCESSED, EVENT_STATUS_SENDING,
  EVENT_STATUS_COMPLETED
} = require('./event-statuses')
const { MESSAGE_STATUS_SENT, MESSAGE_STATUS_ERROR } =
    require('./message-statuses')
const queries = require('./queries')

// Use new event service
const Event = require('../../../lib/models/event')
const eventsService = require('../../../lib/services/events')

/**
 * Creates a notification event (but does not save it)
 * @param  {String}  issuer - email address of user sending message
 * @param {Object} config   - message config
 * @param  {Object}  options   - message data - placed in event metadata
 * @return {Promise}          resolves with event data
 */
const createEvent = (issuer, config, options) => {
  // Create a reference code
  const referenceCode = generateReference(config.prefix)

  // Create event model
  const ev = new Event()
  return ev.fromHash({
    referenceCode,
    type: 'notification',
    subtype: config.messageType,
    issuer,
    metadata: {
      options,
      name: config.name
    },
    status: EVENT_STATUS_PROCESSING
  })
}

/**
 * Marks event as processed, and also updates the number of messages,
 * licence numbers etc.
 * @param  {String}  eventId - the event ID GUID
 * @param  {Array}  licenceNumbers - list of licence numbers for this notification
 * @param {Number} recipientCount
 * @return {Promise}         resolves when event updated
 */
const markAsProcessed = async (eventId, licenceNumbers, recipientCount) => {
  const ev = await eventsService.findOne(eventId)

  // Update event details
  ev.metadata.sent = 0
  ev.metadata.error = 0
  ev.metadata.recipients = recipientCount

  // Create a new set to remove duplicate values
  ev.fromHash({
    status: EVENT_STATUS_PROCESSED,
    licences: [...new Set(licenceNumbers)]
  })

  return eventsService.update(ev)
}

/**
 * Gets the number of messages in a certain status, defaulting to 0
 * @param {Array} - array of statuses and counts retrieved from DB
 * @param {String} status - the status to check
 * @return {Number} of messages in the requested status
 */
const getStatusCount = (statuses, status) => {
  const foundStatus = statuses.find((o) => o.status === status)
  const count = foundStatus.count ?? 0

  return parseInt(count)
}

/**
 * Given an event ID, updates the metadata
 * within the event with the number sent/errored, and if all are sent
 * then the status changes to EVENT_STATUS_COMPLETED
 * @param {String} eventId - the event GUID
 * @param {Promise} resolves with event data
 */
const refreshEventStatus = async (eventId) => {
  const ev = await eventsService.findOne(eventId)

  if (ev.status !== EVENT_STATUS_SENDING) {
    return ev
  }

  // Get breakdown of statuses of messages in this event
  const statuses = await queries.getMessageStatuses(eventId)
  const sent = getStatusCount(statuses, MESSAGE_STATUS_SENT)
  const error = getStatusCount(statuses, MESSAGE_STATUS_ERROR)

  const isComplete = (sent + error) === ev.metadata.recipients

  ev.status = isComplete ? EVENT_STATUS_COMPLETED : EVENT_STATUS_SENDING
  ev.metadata.sent = sent
  ev.metadata.error = error

  return eventsService.update(ev)
}

module.exports = {
  createEvent,
  markAsProcessed,
  refreshEventStatus
}
