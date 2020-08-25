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

  try {
    const batchId = get(job, 'data.batch.id');
    const batch = await batchService.getBatchById(batchId);

    // Populate water.billing_batch_charge_versions
    const billingBatchChargeVersionYears = await chargeVersionService.createForBatch(batch);

    return { billingBatchChargeVersionYears, batch };
  } catch (err) {
    batchJob.logHandlingError(job, err);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
