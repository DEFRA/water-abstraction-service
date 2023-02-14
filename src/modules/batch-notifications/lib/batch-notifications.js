'use strict'

const configs = require('../config')
const eventsService = require('../../../lib/services/events')

/**
 * Loads job data given the event ID
 * @param  {String}  eventId - the event ID GUID
 * @return {Promise<Object>} - resolves with { ev, config }
 */
const loadJobData = async (eventId) => {
  const event = await eventsService.findOne(eventId)

  if (!event) {
    throw new Error(`Batch notification event "${eventId}" not found`)
  }

  // Load config
  const config = configs.find(o => o.messageType === event.subtype)
  if (!config) {
    throw new Error(`Batch notification ${event.subtype} not found`)
  }
  return {
    ev: event.toJSON(),
    config
  }
}

module.exports = {
  loadJobData
}
