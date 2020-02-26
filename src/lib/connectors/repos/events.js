const { Event } = require('../bookshelf');

/**
 * creates a new event record in the database
 * @param {Object} event event pojo
 * @returns {Object} event pojo
 */
const create = async (event) => {
  const result = await Event.forge(event).save();
  return result.toJSON();
};

/**
 * returns the event record for the given id
 * @param {String} id UUID eventId
 * @returns {Object} event pojo
 */
const findOne = async (id) => {
  const result = await Event.forge({ eventId: id }).fetch();
  return result.toJSON();
};

/**
 * Updates the all the fileds for the event record
 * @param {String} id // UUID eventId
 * @param {Object} event // event pojo
 */
const update = async (id, event) => {
  const result = await Event.forge({ eventId: id }).save({ event });
  return result.toJSON();
};

/**
 * Updates an events status value to the supplied value
 * and returns the updated event.
 * @param {String} id UUID eventId
 * @param {String} status The status to set
 * @returns {Object} event pojo
 */
const updateStatus = async (id, status) => {
  const result = await Event.forge({ eventId: id }).save({ status: status });
  return result.toJSON();
};

exports.create = create;
exports.update = update;
exports.updateStatus = updateStatus;
exports.findOne = findOne;
