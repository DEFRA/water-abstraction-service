const { logger } = require('@envage/water-abstraction-helpers');
const queries = require('./queries');
const sendMessage = require('./jobs/send-message');
const refreshEvent = require('./jobs/refresh-event');
const checkStatus = require('./jobs/check-status');

const messageMapper = message => message.id;
const eventMapper = ev => ev.event_id;

const configs = {
  sendMessageBatch: {
    query: () => queries.getSendingMessageBatch(),
    mapper: messageMapper,
    job: sendMessage,
    message: 'Processing notification message batch'
  },
  refreshEvents: {
    query: () => queries.getSendingEvents(),
    mapper: eventMapper,
    job: refreshEvent,
    message: 'Refreshing notification events'
  },
  checkNotifyStatuses: {
    query: () => queries.getNotifyStatusChecks(),
    mapper: messageMapper,
    job: checkStatus,
    message: 'Checking notify statuses'
  }
};

/**
 * Processes a batch of messages, publishing a new message on PG boss for each
 * @param {String} configKey - the config item to process
 * @param  {Function} config.query     - an async function to load a batch of data
 * @param  {Function} config.mapper    - a function to map each data row to an ID
 * @param  {Object} config.job         - the job which handlers the item
 * @param {String} config.message      - log message
 * @return {Promise} resolves when all jobs published
 */
const batchProcessor = async (configKey) => {
  const config = configs[configKey];
  const batch = await config.query();
  const tasks = batch.map(item => config.job.publish(config.mapper(item)));
  logger.info(`${config.message} - ${batch.length} item(s) found`);
  return Promise.all(tasks);
};

/**
* Loads a batch of messages that are in 'sending' status and publishes
* PG boss jobs to send each one
* @type {Function}
* @return {Promise}
*/
const sendMessageBatch = () => batchProcessor('sendMessageBatch');

/**
 * Loads all notification events that are currently in 'sending' status and
 * publishes PG boss jobs to refresh each event with current status
 * @type {Function}
 * @return {Promise}
 */
const refreshEvents = () => batchProcessor('refreshEvents');

/**
 * Loads a batch of messages that are due to have their Notify status checked,
 * and publishes PG boss jobs to check and update Notify status for each one
 * @type {Function}
 * @return {Promise}
 */
const checkNotifyStatuses = () => batchProcessor('checkNotifyStatuses');

module.exports = {
  sendMessageBatch,
  refreshEvents,
  checkNotifyStatuses
};
