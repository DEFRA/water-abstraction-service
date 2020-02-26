const repo = require('../connectors/repos');
const Event = require('../models/event');

/**
 * Creates Event object model from data received from the repo layer
 * @param  {Object} data - data from repository class
 * @return {Object}      - data with keys camel cased
 */
const mapFromRepo = (data) => {
  const event = new Event();
  return event.fromHash(data);
};
/**
 * Creates an Event model object
 * @param  {Event} eventModel for the event
 * @returns {Event} Event model object
 */
const create = async (eventModel) => {
  const result = await repo.events.create(eventModel.toJSON());
  return mapFromRepo(result);
};

/**
 * Fetches an event with the specified ID from the DB
 * @param  {String}  eventId - water service events GUID
 * @returns {Event} Event  model object
 */
const findOne = async (eventId) => {
  const result = await repo.events.findOne(eventId);
  return mapFromRepo(result);
};

/**
 * Persists event to DB
 * Note: mutates event data
 * @param  {Event} eventModel - Event model object
 * @returns {Event} Event model object
 */
const update = async (eventModel) => {
  const result = await repo.events.update({ eventId: eventModel.eventId }, eventModel.toJSON());
  return mapFromRepo(result);
};

/**
 * Updates an events status value to the supplied value
 * and returns the updated event.
 *
 * @param {String} eventId The event id to update
 * @param {String} status The status to set
 * @returns {Event} Event model object
 */
const updateStatus = async (eventId, status) => {
  const result = await repo.events.updateStatus(eventId, status);
  return mapFromRepo(result);
};

exports.create = create;
exports.findOne = findOne;
exports.update = update;
exports.updateStatus = updateStatus;
