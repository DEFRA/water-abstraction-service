'use strict';

const repo = require('../connectors/repos');
const Event = require('../models/event');

/**
 * Creates Event object model from data received from the repo layer
 * @param  {Object} data - data from repository class
 * @return {Object}      - data with keys camel cased
 */
const mapFromRepo = (data) => {
  const { eventId, ...rest } = data;
  const event = new Event(eventId);
  return event.fromHash(rest);
};

/**
 * Maps data from event model back to the Bookshelf repo
 * @param {Event} eventModel
 * @return {Object}
 */
const mapToRepo = eventModel => {
  const { id, ...rest } = eventModel.toJSON();
  return {
    eventId: id,
    ...rest
  };
};

/**
 * Creates an Event model object
 * @param  {Event} eventModel for the event
 * @returns {Event} Event model object
 */
const create = async (eventModel) => {
  const data = mapToRepo(eventModel);
  const result = await repo.events.create(data);
  return mapFromRepo(result);
};

/**
 * Fetches an event with the specified ID from the DB
 * @param  {String}  eventId - water service events GUID
 * @returns {Event} Event  model object
 */
const findOne = async (eventId) => {
  const result = await repo.events.findOne(eventId);
  return mapFromRepo(result);
};

/**
 * Persists event to DB
 * Note: mutates event data
 * @param  {Event} eventModel - Event model object
 * @returns {Event} Event model object
 */
const update = async (eventModel) => {
  const result = await repo.events.update(eventModel.id, mapToRepo(eventModel));
  return mapFromRepo(result);
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
  return mapFromRepo(result);
};

const getMostRecentReturnsInvitationByLicence = async licenceRef => {
  return repo.events.getMostRecentReturnsInvitationByLicence(licenceRef);
};

exports.create = create;
exports.findOne = findOne;
exports.update = update;
exports.updateStatus = updateStatus;
exports.getMostRecentReturnsInvitationByLicence = getMostRecentReturnsInvitationByLicence;
