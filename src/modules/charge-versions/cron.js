'use strict';

const cron = require('node-cron');
const createChargeVersionWorkflows = require('./lib/charge-version-workflow-jobs-processor');

/**
 * Scheduled jobs for batch notification handling
 */
const scheduleJobs = () => cron.schedule('*/5 * * * *', createChargeVersionWorkflows);

module.exports = {
  scheduleJobs
};
