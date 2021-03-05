'use strict';

const Event = require('../models/event');

/**
 * Creates Event object model from data received from the repo layer
 * @param  {Object} data - data from repository class
 * @return {Object}      - data with keys camel cased
 */
const dbToModel = data => {
  const { eventId, ...rest } = data;
  const event = new Event(eventId);
  return event.fromHash(rest);
};

/**
 * Maps data from event model back to the Bookshelf repo
 * @param {Event} eventModel
 * @return {Object}
 */
const modelToDb = eventModel => {
  const { id, scheduledNotifications, ...rest } = eventModel.toJSON();
  return {
    eventId: id,
    ...rest
  };
};

exports.dbToModel = dbToModel;
exports.modelToDb = modelToDb;
