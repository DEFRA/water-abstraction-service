const Boom = require('boom');
const scheduledNotification = require('../../../controllers/notifications').repository;
const { isArray, mapValues } = require('lodash');
const snakeCaseKeys = require('snakecase-keys');
const { findOne } = require('../../../lib/repository-helpers');

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
    throw Boom.boomify(error);
  }
  return row;
};

module.exports = {
  scheduledNotification,
  findById: (id) => (findOne(scheduledNotification, id)),
  createFromObject
};
