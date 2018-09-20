const Boom = require('boom');
const scheduledNotification = require('../../../controllers/notifications').repository;
const { isArray, mapValues } = require('lodash');
const snakeCaseKeys = require('snakecase-keys');

class NotificationNotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'NotificationNotFoundError';
  }
}

/**
 * Finds a scheduled notification by ID
 * @param {String} id - the scheduled_notification GUID
 * @return {Promise} resolves with notification row data
 */
const findById = async (id) => {
  // Load water.scheduled_notification record from DB
  const { rows: [data], error } = await scheduledNotification.find({ id });

  if (error) {
    throw Boom.badImplementation(error);
  }

  if (!data) {
    throw new NotificationNotFoundError(`Error finding scheduled notification ${id}`);
  }

  return data;
};

const stringifyArray = (value) => isArray(value) ? JSON.stringify(value) : value;

const mapObjectToNotification = (data) => {
  return mapValues(snakeCaseKeys(data), stringifyArray);
};

/**
 * Creates a row in the scheduled_notification table
 * If any value supplied is an array it is stringified
 * If an error response is returned, a Boom error is thrown
 * @param {Object} data
 * @return {Promise}
 */
const createFromObject = async (data) => {
  const dbRow = mapObjectToNotification(data);
  // Write data row to scheduled_notification DB table
  const {rows: [row], error} = await scheduledNotification.create(dbRow);
  if (error) {
    throw Boom.badImplementation(error);
  }
  return row;
};

module.exports = {
  scheduledNotification,
  findById,
  createFromObject
};
