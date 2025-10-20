const { logger } = require('../logger')
const newEventService = require('./services/events')
const Event = require('./models/event')

/**
 * Creates an event as a plain object
 * @param  {Object} [data={}] data for the event
 * @return {Object}           event object
 */
const create = (data = {}) => {
  logDeprecatedWarning()
  const timestamp = new Date().toISOString()
  const defaults = {
    referenceCode: null,
    type: null,
    subtype: null,
    issuer: null,
    licences: [],
    entities: [],
    comment: null,
    metadata: {},
    status: null,
    created: timestamp,
    modified: timestamp
  }
  return Object.assign({}, defaults, data)
}

/**
 * Persists event to DB
 * Note: mutates event data
 * @param  {Object} event - plain JS event object
 * @return {Promise}        resolves when event saved
 */
const save = async (event) => {
  // Create service model
  const eventModel = mapToModel(event)

  // Create/update
  const method = eventModel.id ? 'update' : 'create'
  const result = await newEventService[method](eventModel)

  // Mutate the event ID
  event.eventId = result.id

  // Map to PG pool.query response
  return wrapBookshelfModel(mapToEventPojo(result))
}

/**
 * Fetches an event with the specified ID from the DB
 * @param  {String}  eventId - water service events GUID
 * @return {Promise}         [description]
 */
const load = async (eventId) => {
  logDeprecatedWarning()
  const result = await newEventService.findOne(eventId)
  if (result) {
    return mapToEventPojo(result)
  }
  return null
}

/**
 * Updates an events status value to the supplied value
 * and returns the updated event.
 *
 * @param {String} eventId The event id to update
 * @param {String} status The status to set
 */
const updateStatus = async (eventId, status) => {
  logDeprecatedWarning()
  const result = await newEventService.updateStatus(eventId, status)
  return mapToEventPojo(result)
}

const wrapBookshelfModel = (event) => {
  return { rowCount: 1, rows: [event] }
}

const logDeprecatedWarning = () => {
  const err = new Error()
  logger.warn('This Event service has been deprecated. Use the new Event service at ./lib/services/events \n', err.stack)
}

const mapToEventPojo = (event) => {
  const { id, ...rest } = event.toJSON()
  return {
    event_id: id,
    ...rest
  }
}

const mapToModel = event => {
  const { event_id: eventId, ...rest } = event
  const eventModel = new Event(eventId)
  return eventModel.fromHash(rest)
}

exports.create = create
exports.save = save
exports.load = load
exports.updateStatus = updateStatus
