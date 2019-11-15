const { find } = require('lodash');
const event = require('../../../lib/event');
const configs = require('../config');
const messageQueue = require('../../../lib/message-queue');

/**
 * Creates a function which publishes a job on the PG boss queue
 * @param {String} jobName - the name of the PG boss job
 * @param {String} key - the key for the job data eventId|messageId
 * @param {Boolean} isSingleton - only 1 job of this name/ID can be active
 * @return {Function}
 */
const createJobPublisher = (jobName, key, isSingleton = true) => {
  return id => {
    const data = { [key]: id };
    const options = isSingleton ? { singletonKey: id } : {};
    return messageQueue.publish(jobName, data, options);
  };
};

/**
 * Loads job data given the event ID
 * @param  {String}  eventId - the event ID GUID
 * @return {Promise<Object>} - resolves with { ev, config }
 */
const loadJobData = async (eventId) => {
  // Load event
  const ev = await event.load(eventId);
  if (!ev) {
    throw new Error('Batch notification event not found');
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
  createJobPublisher,
  loadJobData
};
