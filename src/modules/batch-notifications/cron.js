const cron = require('node-cron');
const { logger } = require('@envage/water-abstraction-helpers');
const queries = require('./lib/queries');
const sendMessage = require('./lib/jobs/send-message');
const refreshEvent = require('./lib/jobs/refresh-event');
const checkStatus = require('./lib/jobs/check-status');

/**
 * Loads a batch of messages that are in 'sending' status and publishes
 * PG boss messages for each to send them
 * @return {Promise}
 */
const sendMessageBatch = async () => {
  const messages = await queries.getSendingMessageBatch();
  const tasks = messages.map(message => sendMessage.publish(message.id));
  logger.info(`Sending batch notifications - ${messages.length} messages to send`);
  return Promise.all(tasks);
};

/**
 * Loads all notification events that are currently in 'sending' status and
 * updates the event with the latest stats on the batch
 * @return {Promise}
 */
const refreshEvents = async () => {
  const events = await queries.getSendingEvents();
  logger.info(`Refreshing batch notification events - ${events.length} events to check`);
  const tasks = events.map(ev => refreshEvent.publish(ev.event_id));
  return Promise.all(tasks);
};

const checkNotifyStatuses = async () => {
  const messages = await queries.getNotifyStatusChecks();
  logger.info(`Checking notify statuses - ${messages.length} messages to check`);
  const tasks = messages.map(message => checkStatus.publish(message.id));
  return Promise.all(tasks);
};

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
