'use strict';

const { partialRight } = require('lodash');

const { BATCH_STATUS } = require('../../../lib/models/batch');
const processChargeVersionJob = require('./process-charge-version');
const { createOnCompleteHandler } = require('./lib/on-complete');
const batchJob = require('./lib/batch-job');

const handleProcessChargeVersionsComplete = async (job, messageQueue, batch) => {
  try {
    const { eventId } = job.data.request.data;
    const { billingBatchChargeVersionYears } = job.data.response;

    // Publish a job to process each charge version year
    for (const billingBatchChargeVersionYear of billingBatchChargeVersionYears) {
      const message = processChargeVersionJob.createMessage(eventId, billingBatchChargeVersionYear, batch);
      await messageQueue.publish(message);
    }
  } catch (err) {
    batchJob.logOnCompleteError(job, err);
    throw err;
  }
};

module.exports = partialRight(createOnCompleteHandler, handleProcessChargeVersionsComplete, BATCH_STATUS.processing);
