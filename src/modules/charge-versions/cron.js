'use strict';

const cron = require('node-cron');
const createChargeVersionWorkflows = require('./lib/charge-version-workflow-jobs-processor');

/**
 * Scheduled jobs for creating charge version workflows
 */
const scheduleJobs = () => cron.schedule('0 0 */6 * * *', createChargeVersionWorkflows);

module.exports = {
  scheduleJobs
};
