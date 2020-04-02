'use strict';
const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const populateBatchChargeVersionsJob = require('./populate-batch-charge-versions');

const handleCreateBillRunComplete = async (job, messageQueue) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToCreateBillRun);
  }

  const { eventId, batch } = job.data.response;

  try {
    // Publish next job in process
    const message = populateBatchChargeVersionsJob.createMessage(eventId, batch);
    return messageQueue.publish(message);
  } catch (err) {
    console.error(err);
    batchJob.logOnCompleteError(job);
    throw err;
  }
};

module.exports = handleCreateBillRunComplete;
