const moment = require('moment');
const repo = require('./connectors/repos');
const { mapValues, mapKeys } = require('lodash');
const camelCase = require('camelcase');
const snakeCase = require('snake-case');
const { logger } = require('./../logger');

/**
 * Checks whether the supplied value/key is a JSON field and is not null
 * @param {Mixed} value
 * @param {String} key
 * @return {Boolean} true if key is a JSON field and value is not null
 */
const isMappedField = (value, key) => {
  const jsonFields = ['licences', 'entities', 'metadata', '_licences', '_entities', '_metadata'];
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
 * Maps keys for data coming from repository class
 * @param  {Object} data - data from repository class
 * @return {Object}      - data with keys camel cased
 */
const mapFromRepo = data => keyMapper(data, camelCase);

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
    event.modified = moment().format('YYYY-MM-DD HH:mm:ss');
    const result = await repo.events.update({ eventId: event.event_id }, mapToRepo(event));
    const model = mapFromRepo(result);
    return wrapBookshelfModel(model);
  }
  // Create new event
  const result = await repo.events.create(mapToRepo(event));
  const model = mapFromRepo(result);
  return wrapBookshelfModel(model);
};

/**
 * Fetches an event with the specified ID from the DB
 * @param  {String}  eventId - water service events GUID
 * @return {Promise}         [description]
 */
const load = async (eventId) => {
  logDeprecatedWarning();
  const result = await repo.events.findOne(eventId);
  if (!result.event_id) {
    return null;
  }
  const model = mapFromRepo(result);
  model.event_id = model.eventId;
  return model;
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
  const result = await repo.events.updateStatus(eventId, status);
  const model = mapFromRepo(result);
  model.event_id = model.eventId;
  return model;
};

const wrapBookshelfModel = (event) => {
  event.event_id = event.eventId;
  return { rowCount: 1, rows: [event] };
};

const logDeprecatedWarning = () => {
  const err = new Error();
  logger.warn('This Event service has been deprecated. Use the new Event service at ./lib/services/events \n', err.stack);
};

exports.repo = repo;
exports.create = create;
exports.save = save;
exports.load = load;
exports.updateStatus = updateStatus;
