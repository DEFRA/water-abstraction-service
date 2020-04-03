'use strict';

const { get } = require('lodash');

const batchJob = require('./lib/batch-job');
const batchService = require('../services/batch-service');
const chargeVersionService = require('../services/charge-version-service');

const JOB_NAME = 'billing.populate-batch-charge-versions.*';

const createMessage = (eventId, batch) => {
  return batchJob.createMessage(JOB_NAME, batch, { eventId }, {
    singletonKey: batch.id
  });
};

const handlePopulateBatch = async job => {
  batchJob.logHandling(job);

  const batchId = get(job, 'data.batch.id');

  const batch = await batchService.getBatchById(batchId);

  const billingBatchChargeVersions = await chargeVersionService.createForBatch(batch);

  // Include the charge versions in the response data. This information
  // can then be used in the onComplete callback to decide if a new job
  // should be published.
  return { billingBatchChargeVersions, batch: job.data.batch };
};

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
