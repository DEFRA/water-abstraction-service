const uuidv4 = require('uuid/v4');
const moment = require('moment');
const { pool } = require('./connectors/db');
const Repository = require('@envage/hapi-pg-rest-api/src/repository');
const { mapValues, mapKeys } = require('lodash');
const camelCase = require('camelcase');
const snakeCase = require('snake-case');

const repo = new Repository({
  connection: pool,
  table: 'water.events',
  primaryKey: 'event_id'
});

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
  const defaults = {
    eventId: null,
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
const save = (event) => {
  // Update existing record
  if (event.eventId) {
    event.modified = moment().format('YYYY-MM-DD HH:mm:ss');
    return repo.update({ event_id: event.eventId }, mapToRepo(event));
  }
  // Create new event
  event.eventId = uuidv4();
  return repo.create(mapToRepo(event));
};

/**
 * Loads an event with the specified ID
 * @param  {String}  eventId - water service events GUID
 * @return {Promise}         [description]
 */
const load = async (eventId) => {
  const result = await repo.find({ event_id: eventId });

  if (result.rowCount === 0) {
    return null;
  }

  return mapFromRepo(result.rows[0]);
};

module.exports = {
  repo,
  create,
  save,
  load
};
