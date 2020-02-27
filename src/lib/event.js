const moment = require('moment');
const { logger } = require('../logger');
const newEventService = require('./services/events');
const Event = require('./models/event');
const uuid = require('uuid/v4');
/**
 * Creates an event as a plain object
 * @param  {Object} [data={}] data for the event
 * @return {Object}           event object
 */
const create = (data = {}) => {
  logDeprecatedWarning();
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
    created: moment().format('YYYY-MM-DD HH:mm:ss'),
    modified: null
  };
  return Object.assign({}, defaults, data);
};

/**
 * Persists event to DB
 * Note: mutates event data
 * @param  {Object} event - plain JS event object
 * @return {Promise}        resolves when event saved
 */
const save = async (event) => {
  logDeprecatedWarning();
  // Update existing record
  if (event.event_id) {
    event.eventId = event.event_id;
    const eventModel = new Event();
    const result = await newEventService.update(eventModel.fromHash(event));
    return wrapBookshelfModel(mapToEventPojo(result));
  }
  // Create new event
  event.eventId = uuid();
  const eventModel = new Event();
  eventModel.fromHash(event);
  const result = await newEventService.create(eventModel);
  return wrapBookshelfModel(mapToEventPojo(result));
};

/**
 * Fetches an event with the specified ID from the DB
 * @param  {String}  eventId - water service events GUID
 * @return {Promise}         [description]
 */
const load = async (eventId) => {
  logDeprecatedWarning();
  const result = await newEventService.findOne(eventId);
  if (!result.eventId) {
    return null;
  }
  return mapToEventPojo(result);
};

/**
 * Updates an events status value to the supplied value
 * and returns the updated event.
 *
 * @param {String} eventId The event id to update
 * @param {String} status The status to set
 */
const updateStatus = async (eventId, status) => {
  logDeprecatedWarning();
  const result = await newEventService.updateStatus(eventId, status);
  return mapToEventPojo(result);
};

const wrapBookshelfModel = (event) => {
  return { rowCount: 1, rows: [event] };
};

const logDeprecatedWarning = () => {
  const err = new Error();
  logger.warn('This Event service has been deprecated. Use the new Event service at ./lib/services/events \n', err.stack);
};

const mapToEventPojo = (event) => {
  const eventPOJO = event.toJSON();
  eventPOJO.event_id = event.eventId;
  return eventPOJO;
};

exports.create = create;
exports.save = save;
exports.load = load;
exports.updateStatus = updateStatus;
