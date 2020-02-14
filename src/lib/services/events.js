// const moment = require('moment');
const repo = require('../connectors/repos');
const { mapValues, mapKeys } = require('lodash');
const camelCase = require('camelcase');
const snakeCase = require('snake-case');
const Event = require('../models/event');

/**
 * Checks whether the supplied value/key is a JSON field and is not null
 * @param {Mixed} value
 * @param {String} key
 * @return {Boolean} true if key is a JSON field and value is not null
 */
const isMappedField = (value, key) => {
  const jsonFields = ['licences', 'entities', 'metadata'];
  return jsonFields.includes(key) && (value !== null);
};

/**
 * Maps keys of the data using the supplied mapper function
 * @param  {Object} data     - data to map
 * @param  {Function} mapper - function to use for mapping keys
 * @return {Object}        data with keys mapped
 */
const keyMapper = (data, mapper) => {
  return mapKeys(data, (value, key) => mapper(key));
};

/**
 * Maps data to the format expected by the repository class
 * @param  {Object} data - event data
 * @return {Object}      - event data mapped to DB column names/types
 */
const mapToRepo = data => {
  const mapped = mapValues(data, (value, key) => {
    return isMappedField(value, key) ? JSON.stringify(value) : value;
  });
  return keyMapper(mapped, snakeCase);
};

/**
 * Maps keys for data coming from repository class and
 * returns a new Event model POJO created from the mapped data
 * @param  {Object} data - data from repository class
 * @return {Object}      - data with keys camel cased
 */
const mapFromRepo = (data) => {
  const result = keyMapper(data, camelCase);
  const event = new Event();
  return event.fromHash(result);
};
/**
 * Creates an event as a plain object
 * @param  {Object} [data={}] data for the event
 * @returns {Event} plain JS event object
 */
const create = async (data) => {
  const result = await repo.events.create(mapToRepo(data));
  return mapFromRepo(result);
};

/**
 * Fetches an event with the specified ID from the DB
 * @param  {String}  eventId - water service events GUID
 * @returns {Event} plain JS event object
 */
const findOne = async (eventId) => {
  const result = await repo.events.findOne(eventId);
  return mapFromRepo(result);
};

/**
 * Persists event to DB
 * Note: mutates event data
 * @param  {Object} event - plain JS event object
 * @returns {Event} plain JS event object
 */
const update = async (event) => {
  const result = await repo.events.update({ eventId: event.eventId }, mapToRepo(event));
  return mapFromRepo(result);
};

/**
 * Updates an events status value to the supplied value
 * and returns the updated event.
 *
 * @param {String} eventId The event id to update
 * @param {String} status The status to set
 * @returns {Event} plain JS event object
 */
const updateStatus = async (eventId, status) => {
  const result = await repo.events.updateStatus(eventId, status);
  return mapFromRepo(result);
};

exports.create = create;
exports.findOne = findOne;
exports.update = update;
exports.updateStatus = updateStatus;
