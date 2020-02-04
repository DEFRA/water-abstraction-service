const { Event } = require('../bookshelf');
const { uuidv4 } = require('uuid/V4');
const { moment } = require('moment');

/**
 * creates a new event record in the database
 * @param {*} event // event model
 */
const create = async (event) => {
  event.eventId = uuidv4();
  const model = await Event.forge((event)).save();
  return model.toJSON();
};

/**
 * returns the event record for the given id
 * @param {*} id // uuid for the event_id
 */
const findOne = async (id) => {
  const model = await Event
    .forge({ event_id: id });
  return model.toJSON();
};

/**
 * Updates the all the fileds for the event record
 * @param {*} event // event model
 */
const update = async (event) => {
  event.modified = moment().format('YYYY-MM-DD HH:mm:ss');
  const result = await Event.where({ event_id: event.eventId }).save({ modified: event.modified }, { patch: true });
  return result.toJSON();
};

/**
 * Updates an events status value to the supplied value
 * and returns the updated event.
 *
 * @param {String} eventId The event id to update
 * @param {String} status The status to set
 */
const updateStatus = async (eventId, status) => {
  const model = await Event.where({ event_id: eventId }).save({ status: status }, { patch: true });
  return model.toJSON();
};

exports.create = create;
exports.update = update;
exports.updateStatus = updateStatus;
exports.findOne = findOne;
