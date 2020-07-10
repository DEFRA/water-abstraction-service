'use strict';

const { get } = require('lodash');

const batchJob = require('./lib/batch-job');
const batchService = require('../services/batch-service');
const chargeVersionService = require('../services/charge-version-service');
const chargeVersionYearService = require('../services/charge-version-year');

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

  // Populate water.billing_batch_charge_versions
  await chargeVersionService.createForBatch(batch);

  // Populate water.billing_batch_charge_version_years
  const billingBatchChargeVersionYears = await chargeVersionYearService.createForBatch(batch);

  return { billingBatchChargeVersionYears, batch };
};

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
