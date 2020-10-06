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

const options = {
  teamSize: 50,
  teamConcurrency: 2
};

const handleProcessChargeVersionComplete = async (job, messageQueue, batch) => {
  try {
    const { eventId } = job.data.request.data;

    const { processing } = await chargeVersionYearService.getStatusCounts(batch.id);

    if (processing === 0) {
      logger.info(`No more charge version year entries to process for batch: ${batch.id}`);

      await batchJob.deleteOnCompleteQueue(job, messageQueue);

      // Check if batch requires TPT review
      const numberOfUnapprovedBillingVolumes = await billingVolumeService.getUnapprovedVolumesForBatchCount(batch);
      if (numberOfUnapprovedBillingVolumes > 0) {
        await batchService.setStatus(batch.id, BATCH_STATUS.review);
        return;
      }

      // Otherwise proceed with preparing transactions
      const message = prepareTransactionsJob.createMessage(eventId, batch);
      await messageQueue.publish(message);
      return;
    }

    logger.info(`${processing} items yet to be processed for batch ${batch.id}`);
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

module.exports = partialRight(createOnCompleteHandler, handleProcessChargeVersionComplete, BATCH_STATUS.processing);
module.exports.options = options;
