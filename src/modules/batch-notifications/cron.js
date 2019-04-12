const cron = require('node-cron');
const { logger } = require('@envage/water-abstraction-helpers');
const queries = require('./lib/queries');
const sendMessage = require('./lib/jobs/send-message');
const refreshEvent = require('./lib/jobs/refresh-event');
const checkStatus = require('./lib/jobs/check-status');

/**
 * Creates a batch handling function
 * @param  {Function} batchLoader  - an async function to load a batch of data
 * @param  {Function} mapper       - a function to map each data row to an ID
 * @param  {Function} jobPublisher - function to publish PG boss job
 * @param {String} message         - log message
 * @return {Function}
 */
const createBatchProcessor = (batchLoader, mapper, jobPublisher, message) => {
  return async () => {
    const batch = await batchLoader();
    const tasks = batch.map(item => jobPublisher(mapper(item)));
    logger.info(`${message} - ${batch.length} item(s) found`);
    return Promise.all(tasks);
  };
};

const messageMapper = message => message.id;
const eventMapper = ev => ev.event_id;

/**
* Loads a batch of messages that are in 'sending' status and publishes
* PG boss jobs to send each one
* @type {Function}
* @return {Promise}
*/
const sendMessageBatch = createBatchProcessor(
  queries.getSendingMessageBatch,
  messageMapper,
  sendMessage.publish,
  'Processing notification message batch'
);

/**
 * Loads all notification events that are currently in 'sending' status and
 * publishes PG boss jobs to refresh each event with current status
 * @type {Function}
 * @return {Promise}
 */
const refreshEvents = createBatchProcessor(
  queries.getSendingEvents,
  eventMapper,
  refreshEvent.publish,
  'Refreshing notification events'
);

/**
 * Loads a batch of messages that are due to have their Notify status checked,
 * and publishes PG boss jobs to check and update Notify status for each one
 * @type {Function}
 * @return {Promise}
 */
const checkNotifyStatuses = createBatchProcessor(
  queries.getNotifyStatusChecks,
  messageMapper,
  checkStatus.publish,
  'Checking notify statuses'
);

/**
 * Scheduled jobs for batch notification handling
 */
const scheduleJobs = () => {
  cron.schedule('0/15 * * * * *', refreshEvents);
  cron.schedule('0/15 * * * * *', sendMessageBatch);
  cron.schedule('0/15 * * * * *', checkNotifyStatuses);
};

module.exports = {
  scheduleJobs
};
