const { get } = require('lodash');
const { createChargeVersionYears } = require('./lib/batch-charge-versions');
const repo = require('../../lib/connectors/repository');
const { batchStatus } = require('./lib/batch');
const { logger } = require('../../logger');

const populateBatchChargeVersions = require('./jobs/populate-batch-charge-versions');
const processChargeVersions = require('./jobs/process-charge-versions');

/**
 * Handles the response from populating the billing batch with charge versions and decides
 * whether or not to publish a new job to continue with the batch flow.
 *
 * If batch charge versions were created, then create the batch charge version year
 * entries and publish
 *
 * @param {Object} job PG Boss job (including response from populateBatchChargeVersions handler)
 */
const handlePopulateBatchChargeVersionsComplete = async (job, messageQueue) => {
  logger.info(`onComplete - ${populateBatchChargeVersions.jobName}`);

  const { chargeVersions, batch } = job.data.response;
  const { eventId } = job.data.request.data;

  if (chargeVersions.length > 0) {
    const batchChargeVersionYears = createChargeVersionYears(batch, chargeVersions);

    for (const version of batchChargeVersionYears) {
      const result = await repo.billingBatchChargeVersionYears.create(version);
      const message = processChargeVersions.createMessage(eventId, get(result, 'rows[0]', null));
      await messageQueue.publish(message);
    }
  }
};

const handleProcessChargeVersionsComplete = async job => {
  logger.info(`onComplete - ${processChargeVersions.jobName}`);

  const { chargeVersionYear } = job.data.response;
  const batchId = chargeVersionYear.billing_batch_id;

  const { rowCount } = await repo.billingBatchChargeVersionYears.findProcessingByBatch(batchId);

  if (rowCount === 0) {
    logger.info(`No more charge version year entries to process for batch: ${batchId}`);
    await repo.billingBatches.setStatus(batchId, batchStatus.complete);
  } else {
    logger.info(`${rowCount} items yet to be processed for batch ${batchId}`);
  }
};

module.exports = {
  name: 'billingRegisterSubscribers',
  register: async server => {
    await server.messageQueue.subscribe(populateBatchChargeVersions.jobName, populateBatchChargeVersions.handler);
    await server.messageQueue.onComplete(populateBatchChargeVersions.jobName, job => {
      return handlePopulateBatchChargeVersionsComplete(job, server.messageQueue);
    });

    await server.messageQueue.subscribe(processChargeVersions.jobName, processChargeVersions.handler);
    await server.messageQueue.onComplete(processChargeVersions.jobName, job => handleProcessChargeVersionsComplete(job));
  }
};
