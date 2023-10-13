'use strict'

const { EVENT_STATUS_PROCESSED, EVENT_STATUS_SENDING } = require('./event-statuses')
const { MESSAGE_STATUS_SENDING } = require('./message-statuses')
const errors = require('../../../lib/errors')
const messageHelpers = require('./message-helpers')
const eventsService = require('../../../lib/services/events')

const assertEventIsValid = (eventId, ev, issuer) => {
  if (!ev) {
    throw new errors.NotFoundError(`Event ${eventId} not found`)
  }
  if (ev.type !== 'notification') {
    throw new errors.ConflictingDataError(`Event ${eventId} not of type "notification"`)
  }
  if (ev.status !== EVENT_STATUS_PROCESSED) {
    throw new errors.ConflictingDataError(`Event ${eventId} not of status ${EVENT_STATUS_PROCESSED}`)
  }
  if (ev.issuer !== issuer) {
    throw new errors.UnauthorizedError(`Event ${eventId} issuer does not match that supplied`)
  }
}
/**
 * Completing a separate check for the status as sending
 * If true it is because there is duplicate requests sharing the same event ID, possibly due to double-clicking
 * In this case we do not want it to error.
 */
const assertEventIsDuplicate = (event) => {
  return event.status === EVENT_STATUS_SENDING
}

/**
 * Sends the processed notification with the requested event Id
 * @param {String} eventId - guid from water.events
 * @param {String} issuer - user email address
 * @return {Promise<Event>} - updated event
 */
const send = async (eventId, issuer) => {
  const event = await eventsService.findOne(eventId)

  if (assertEventIsDuplicate(event)) {
    return event
  }

  assertEventIsValid(eventId, event, issuer)

  // Update scheduled_notifications to new status
  const tasks = [
    messageHelpers.updateMessageStatuses(event.id, MESSAGE_STATUS_SENDING),
    eventsService.updateStatus(event.id, EVENT_STATUS_SENDING)
  ]

  const [, data] = await Promise.all(tasks)

  return data
}

exports.send = send
