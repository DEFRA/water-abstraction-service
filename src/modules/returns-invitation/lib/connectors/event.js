const moment = require('moment');
const { repository: eventRepository } = require('../../../../controllers/events');

/**
 * Accepts a notification state object, and outputs an object for writing
 * to the events table
 * @param {Object} notification state
 * @return {Object} event row data
 */
const prepareEventRow = (event) => {
  const { licences, entities, ...rest } = event;
  return {
    licences: JSON.stringify(licences),
    entities: JSON.stringify(entities),
    ...rest,
    created: moment().format()
  };
};

/**
 * Persists an event to the events table based on a notification state
 * object
 * @param {Object} state
 * @return {Promise} resolves when event sent
 */
const persist = (event) => {
  const row = prepareEventRow(event);
  return eventRepository.create(row);
};

module.exports = {
  prepareEventRow,
  persist
};
