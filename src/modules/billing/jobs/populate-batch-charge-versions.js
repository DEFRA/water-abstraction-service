'use strict';

const { get } = require('lodash');

const batchJob = require('./lib/batch-job');
const batchService = require('../services/batch-service');
const chargeVersionService = require('../services/charge-version-service');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

const JOB_NAME = 'billing.populate-batch-charge-versions.*';

const createMessage = (eventId, batch) => {
  return batchJob.createMessage(JOB_NAME, batch, { eventId }, {
    singletonKey: batch.id
  });
};

const handlePopulateBatch = async job => {
  batchJob.logHandling(job);
  const batchId = get(job, 'data.batch.id');

  try {
    const batch = await batchService.getBatchById(batchId);

    // Populate water.billing_batch_charge_versions
    const billingBatchChargeVersionYears = await chargeVersionService.createForBatch(batch);

    return { billingBatchChargeVersionYears, batch };
  } catch (err) {
    await batchJob.logHandlingErrorAndSetBatchStatus(job, err, BATCH_ERROR_CODE.failedToPopulateChargeVersions);
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
