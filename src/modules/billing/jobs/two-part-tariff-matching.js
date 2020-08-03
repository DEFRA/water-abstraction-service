'use strict';

const { get } = require('lodash');

const batchJob = require('./lib/batch-job');
const batchStatus = require('./lib/batch-status');

const batchService = require('../services/batch-service');
const billingVolumeService = require('../services/billing-volumes-service');
const twoPartTariffService = require('../services/two-part-tariff');

const JOB_NAME = 'billing.two-part-tariff-matching.*';

const createMessage = (eventId, batch) => {
  return batchJob.createMessage(JOB_NAME, batch, { eventId }, {
    singletonKey: batch.id
  });
};

const handleTwoPartTariffMatching = async job => {
  batchJob.logHandling(job);

  try {
    // Get batch
    const batchId = get(job, 'data.batch.id');
    const batch = await batchService.getBatchById(batchId);

    // Check batch in "processing" status
    batchStatus.assertBatchIsProcessing(batch);

    // Do TPT returns matching and populate water.billing_volumes
    await twoPartTariffService.processBatch(batch);

    // Check if there are any TPT billing volumes for review
    // If there are, we go to the TPT review stage
    const unapprovedBillingVolumeCount = await billingVolumeService.getUnapprovedVolumesForBatchCount(batch);
    const isReviewNeeded = unapprovedBillingVolumeCount > 0;
    if (isReviewNeeded) {
      await batchService.setStatusToReview(batch.id);
    }
    return { isReviewNeeded };
  } catch (err) {
    batchJob.logHandlingError(job, err);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handleTwoPartTariffMatching;
exports.jobName = JOB_NAME;
