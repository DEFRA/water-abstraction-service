'use strict';

const { logger } = require('../../../logger');
const licenceVersions = require('../../../lib/connectors/repos/licence-versions');
const createChargeVersionWorkflow = require('../jobs/create-charge-version-workflows');
const moment = require('moment');
const { queueManager } = require('../../../lib/message-queue-v2');

/**
 * Processes a batch of messages, publishing a new job message each
 * @param  {Function} config.query     - an async function to load a batch of data
 * @param  {Function} config.mapper    - a function to map each data row to an ID
 * @param  {Object} config.job         - the job which handlers the item
 * @param {String} config.message      - log message
 * @return {Promise} resolves when all jobs published
 */
const createChargeVersionWorkflows = async () => {
  const batch = await licenceVersions.findIdsCreatedAfterDate(moment().add(-24, 'hour').toISOString());
  const tasks = batch.map(item => {
    console.log(item);
    queueManager.add(createChargeVersionWorkflow.jobName, item.licenceVersionId, item.licenceId);
  });
  logger.info(`Creating charge version workflow batch - ${batch.length} item(s) found`);
  return Promise.all(tasks);
};

module.exports = createChargeVersionWorkflows;
