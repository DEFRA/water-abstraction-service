const cron = require('node-cron');
const batchProcessors = require('./lib/batch-processors');

/**
 * Scheduled jobs for batch notification handling
 */
const scheduleJobs = () => {
  cron.schedule('* * * * *', batchProcessors.refreshEvents);
  cron.schedule('0/15 * * * * *', batchProcessors.sendMessageBatch);
  cron.schedule('0/15 * * * * *', batchProcessors.checkNotifyStatuses);
};

module.exports = {
  scheduleJobs
};
