const cron = require('node-cron');
const queries = require('./lib/queries');
const sendMessage = require('./lib/jobs/send-message');
const refreshEvent = require('./lib/jobs/refresh-event');

const sendMessageBatch = async () => {
  const messages = await queries.getSendingMessageBatch();
  const tasks = messages.map(message => sendMessage.publish(message.id));
  console.log(`Sending batch notifications - ${messages.length} messages to send`);
  return Promise.all(tasks);
};

const refreshEvents = async () => {
  const events = await queries.getSendingEvents();
  console.log(`Refreshing batch notification events - ${events.length} events to check`);
  const tasks = events.map(ev => refreshEvent.publish(ev.event_id));
  return Promise.all(tasks);
};

/**
 * Scheduled jobs for batch notification handling
 */
const scheduleJobs = () => {
  cron.schedule('* * * * *', refreshEvents);
  cron.schedule('* * * * *', sendMessageBatch);
};

module.exports = {
  scheduleJobs
};
