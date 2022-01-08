'use strict';

const repo = require('../connectors/repos');
const camelCase = require('../camel-case-keys');

const eventMapper = require('../mappers/event');
const notificationEventMapper = require('../mappers/notification-event');
const Pagination = require('../models/pagination');

/**
 * Creates an Event model object
 * @param  {Event} eventModel for the event
 * @returns {Event} Event model object
 */
const create = async (eventModel) => {
  const data = eventMapper.modelToDb(eventModel);
  const result = await repo.events.create(data);
  return eventMapper.dbToModel(result);
};

/**
 * Fetches an event with the specified ID from the DB
 * @param  {String}  eventId - water service events GUID
 * @returns {Event} Event  model object
 */
const findOne = async (eventId) => {
  const result = await repo.events.findOne(eventId);
  return eventMapper.dbToModel(result);
};

/**
 * Persists event to DB
 * Note: mutates event data
 * @param  {Event} eventModel - Event model object
 * @returns {Event} Event model object
 */
const update = async (eventModel) => {
  const result = await repo.events.update(eventModel.id, eventMapper.modelToDb(eventModel));
  return eventMapper.dbToModel(result);
};

/**
 * Updates an events status value to the supplied value
 * and returns the updated event.
 *
 * @param {String} eventId The event id to update
 * @param {String} status The status to set
 * @returns {Event} Event model object
 */
const updateStatus = async (eventId, status) => {
  const result = await repo.events.update(eventId, { status });
  return eventMapper.dbToModel(result);
};

const getMostRecentReturnsInvitationByLicence = async licenceRef => {
  return repo.events.getMostRecentReturnsInvitationByLicence(licenceRef);
};

const nullIfEmpty = (arr = []) => arr.length ? arr : null;

const getKPIReturnsMonthly = async () => {
  const result = await repo.events.getKPIReturnsMonthlyData();
  return nullIfEmpty(camelCase(result.rows));
};

const getKPILicenceNames = async () => {
  const result = await repo.events.getKPILicenceNamesData();
  return nullIfEmpty(camelCase(result.rows));
};

/**
 * Gets paginated notification events
 * @param {Number} page
 * @param categories
 * @param sender
 * @return {Promise<Object>} { data : [], pagination : {} }
 */
const getNotificationEvents = async (page = 1, categories = '', sender = '') => {
  // Initialise pagination model
  const pagination = new Pagination()
    .fromHash({
      page,
      perPage: 50
    });

  // Find and map data to NotificationEvent service models
  const { rows } = await repo.events.findNotifications({
    limit: pagination.perPage,
    offset: pagination.startIndex,
    categories,
    sender
  });
  const data = rows
    .map(camelCase)
    .map(notificationEventMapper.dbToModel);

  // Update pagination with total rows
  const { rows: [{ count: totalRows }] } = await repo.events.findNotificationsCount();
  pagination.totalRows = totalRows;

  return { pagination, data };
};

exports.create = create;
exports.findOne = findOne;
exports.update = update;
exports.updateStatus = updateStatus;
exports.getMostRecentReturnsInvitationByLicence = getMostRecentReturnsInvitationByLicence;
exports.getKPIReturnsMonthly = getKPIReturnsMonthly;
exports.getKPILicenceNames = getKPILicenceNames;
exports.getNotificationEvents = getNotificationEvents;
