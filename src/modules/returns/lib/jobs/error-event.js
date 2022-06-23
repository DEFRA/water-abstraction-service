const eventsService = require('../../../../lib/services/events')
const { set } = require('lodash')
const { uploadStatus } = require('../returns-upload')

/**
 * Creates an object that describes the error that has happened
 * that will end the processing of the current event.
 *
 * @param {Error} error The thrown JavaScript error
 * @returns {Object} The error details to save in the event
 */
const createEventError = (error = {}) => {
  const { message, key = 'server' } = error
  return { message, key }
}

/**
 * Updates the event to include error information.
 *
 * The error may have been an unexpected exception in which case the key will
 * be set to server, or it may be a known error in which case the error.key
 * property will be used.
 *
 * Also sets the event status to error and saves the event.
 *
 * @param {Object} event The event object from the water.events table
 * @param {Error} error The thrown JavaScript error
 * @returns {Promise}
 */
const setEventError = (event, error) => {
  const eventError = createEventError(error)
  set(event, 'metadata.error', eventError)
  event.status = uploadStatus.ERROR
  return eventsService.update(event)
}

exports.setEventError = setEventError
exports.keys = {
  SERVER: 'server',
  USER_NOT_FOUND: 'user-not-found',
  INVALID_DATE: 'invalid-date-format',
  xml: {
    INVALID: 'invalid-xml',
    MAPPING: 'xml-to-json-mapping-failure'
  },
  csv: {
    INVALID: 'invalid-csv',
    MAPPING: 'csv-to-json-mapping-failure'
  }
}

exports.throwEventNotFoundError = eventId => { throw new Error(`Bulk upload event "${eventId}" not found`) }
