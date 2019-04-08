const { find } = require('lodash');
const event = require('../../../lib/event');
const configs = require('../config');

/**
 * Creates job data for publishing on the PG boss message queue
 * We just publish the event ID and load the event/config in the hander
 * using this
 * @param  {String} eventId - event GUID
 * @return {Object}         - job data for PG boss job
 */
const buildJobData = eventId => ({ eventId });

/**
 * Loads job data given the event ID
 * @param  {String}  eventId - the event ID GUID
 * @return {Promise<Object>} - resolves with { ev, config }
 */
const loadJobData = async (eventId) => {
  // Load event
  const ev = await event.load(eventId);
  if (!ev) {
    throw new Error(`Batch notification event not found`);
  }
  // Load config
  const config = find(configs, { messageType: ev.subtype });
  if (!config) {
    throw new Error(`Batch notification ${ev.subtype} not found`);
  }
  return {
    ev,
    config
  };
};

module.exports = {
  buildJobData,
  loadJobData
};
