const { Event } = require('../bookshelf');

/**
 * creates a new event record in the database
 * @param {*} event // event model
 */
const create = async (event) => {
  const model = await Event.forge(event).save();
  return model.toJSON();
};

/**
 * returns the event record for the given id
 * @param {*} id // uuid for the eventId
 */
const findOne = async (id) => {
  const model = await Event.forge({ eventId: id }).fetch();
  return model.toJSON();
};

/**
 * Updates the all the fileds for the event record
 * @param {uuid} id // eventId
 * @param {Event} event // event model
 */
const update = async (id, event) => {
  const model = await Event.forge({ eventId: id }).save({ event });
  return model.toJSON();
};

/**
 * Updates an events status value to the supplied value
 * and returns the updated event.
 * @param {String} id The event id to update
 * @param {String} status The status to set
 */
const updateStatus = async (id, status) => {
  const model = await Event.forge({ eventId: id }).save({ status: status });
  return model.toJSON();
};

exports.create = create;
exports.update = update;
exports.updateStatus = updateStatus;
exports.findOne = findOne;
