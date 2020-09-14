'use strict';

const { partialRight } = require('lodash');

const prepareTransactionsJob = require('./prepare-transactions');
const { logger } = require('../../../logger');
const batchJob = require('./lib/batch-job');
const { createOnCompleteHandler } = require('./lib/on-complete');
const { BATCH_STATUS } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');
const billingVolumeService = require('../services/billing-volumes-service');

const chargeVersionYearService = require('../services/charge-version-year');

const handleProcessChargeVersionComplete = async (job, messageQueue, batch) => {
  try {
    const { eventId } = job.data.request.data;
    const { chargeVersionYear, batch: batchFromJobData } = job.data.response;
    const batchId = chargeVersionYear.billingBatchId;

    const { processing } = await chargeVersionYearService.getStatusCounts(batchId);

    if (processing === 0) {
      logger.info(`No more charge version year entries to process for batch: ${batchId}`);

      await batchJob.deleteOnCompleteQueue(job, messageQueue);

      // Check if batch requires TPT review
      const numberOfUnapprovedBillingVolumes = await billingVolumeService.getUnapprovedVolumesForBatchCount(batch);
      if (numberOfUnapprovedBillingVolumes > 0) {
        return batchService.setStatus(batch.id, BATCH_STATUS.review);
      }

      // Otherwise proceed with preparing transactions
      const message = prepareTransactionsJob.createMessage(eventId, batchFromJobData);
      return messageQueue.publish(message);
    }

    logger.info(`${processing} items yet to be processed for batch ${batchId}`);
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

module.exports = partialRight(createOnCompleteHandler, handleProcessChargeVersionComplete, BATCH_STATUS.processing);
