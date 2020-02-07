const { Event } = require('../bookshelf');
const moment = require('moment');

/**
 * creates a new event record in the database
 * @param {*} event // event model
 */
const create = async (event) => {
  event.created = moment().format('YYYY-MM-DD HH:mm:ss');
  const model = await Event.forge(event).save();
  return model.toJSON();
};

/**
 * returns the event record for the given id
 * @param {*} id // uuid for the event_id
 */
const findOne = async (id) => {
  const model = await Event.forge({ event_id: id }).fetch();
  return model.toJSON();
};

/**
 * Updates the all the fileds for the event record
 * @param {uuid} id // event_id
 * @param {Event} event // event model
 */
const update = async (id, event) => {
  event.modified = moment().format('YYYY-MM-DD HH:mm:ss');
  const model = await Event.forge(event).where({ event_id: id }).save();
  return model.toJSON();
};

/**
 * Updates an events status value to the supplied value
 * and returns the updated event.
 *
 * @param {String} id The event id to update
 * @param {String} status The status to set
 */
const updateStatus = async (id, status) => {
  const modifiedDate = moment().format('YYYY-MM-DD HH:mm:ss');
  const model = await Event.forge()
    .where({ event_id: id })
    .save({ status: status, modified: modifiedDate }, { patch: true });
  return model.toJSON();
};

exports.create = create;
exports.update = update;
exports.updateStatus = updateStatus;
exports.findOne = findOne;
