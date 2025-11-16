'use strict'

const generateReference = require('../../../lib/reference-generator')
const {
  EVENT_STATUS_PROCESSING, EVENT_STATUS_PROCESSED
} = require('./event-statuses')

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

module.exports = {
  createEvent,
  markAsProcessed
}
