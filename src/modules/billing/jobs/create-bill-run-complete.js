'use strict';

const batchJob = require('./lib/batch-job');
const { BATCH_STATUS } = require('../../../lib/models/batch');
const populateBatchChargeVersionsJob = require('./populate-batch-charge-versions');

const { partialRight } = require('lodash');
const { createOnCompleteHandler } = require('./lib/on-complete');

const handleCreateBillRunComplete = async (job, messageQueue, batch) => {
  try {
    // Publish next job in process
    const { eventId } = job.data.response;
    const message = populateBatchChargeVersionsJob.createMessage(eventId, batch);
    await messageQueue.publish(message);
  } catch (err) {
    batchJob.logOnCompleteError(job);
    throw err;
  }
};

module.exports = partialRight(createOnCompleteHandler, handleCreateBillRunComplete, BATCH_STATUS.processing);
