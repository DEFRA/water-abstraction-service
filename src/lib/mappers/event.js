'use strict';

const { isNull, isEmpty } = require('lodash');

const Event = require('../models/event');

const mapStatus = status =>
  isEmpty(status) ? null : status;

/**
 * Creates Event object model from data received from the repo layer
 * @param  {Object} data - data from repository class
 * @return {Object}      - data with keys camel cased
 */
const dbToModel = data => {
  if (isNull(data)) {
    return null;
  }
  const { eventId, status, ...rest } = data;
  const event = new Event(eventId);
  return event.fromHash({
    status: mapStatus(status),
    ...rest
  });
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
