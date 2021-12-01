const { Event, bookshelf } = require('../bookshelf');
const queries = require('./queries/events');
const helpers = require('./lib/helpers');

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
const findOne = id =>
  helpers.findOne(Event, 'eventId', id);

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

const getKPIReturnsMonthlyData = () => {
  return bookshelf.knex.raw(queries.getKPIReturnsMonthlyData);
};

const getKPILicenceNamesData = () => {
  return bookshelf.knex.raw(queries.getKPILicenceNamesData);
};

/**
 * Gets notification events for sent/completed/sending
 * with breakdown of related scheduled_notifications statuses in each notification
 *
 * @param {Object} params
 * @param {Number} params.limit
 * @param {Number} params.offset
 */
const findNotifications = params =>
  bookshelf.knex.raw(queries.findNotifications, params);

/**
 * Gets total row count for above
 */
const findNotificationsCount = () =>
  bookshelf.knex.raw(queries.findNotificationsCount);

/**
 * Gets list of categories for filtering notifications
 */
const findNotificationCategories = () =>
  bookshelf.knex.raw(queries.findNotificationCategories);

exports.create = create;
exports.update = update;
exports.findOne = findOne;
exports.getMostRecentReturnsInvitationByLicence = getMostRecentReturnsInvitationByLicence;
exports.getKPIReturnsMonthlyData = getKPIReturnsMonthlyData;
exports.getKPILicenceNamesData = getKPILicenceNamesData;
exports.findNotifications = findNotifications;
exports.findNotificationsCount = findNotificationsCount;
exports.findNotificationCategories = findNotificationCategories;
