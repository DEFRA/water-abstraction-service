const { Event, bookshelf } = require('../bookshelf');
const queries = require('./queries/events');
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
 * Updates the all the fields for the event record
 * @param {String} id
 * @param {Object} changes // event pojo
 */
const update = async (id, changes) => {
  const result = await Event.forge({ eventId: id }).save(changes);
  return result.toJSON();
};

const getMostRecentReturnsInvitationByLicence = async licenceRef => {
  return bookshelf.knex.raw(queries.getMostRecentReturnInvitation, { licenceRef });
};

exports.create = create;
exports.update = update;
exports.findOne = findOne;
exports.getMostRecentReturnsInvitationByLicence = getMostRecentReturnsInvitationByLicence;
