const Bull = require('bull');
const { get } = require('lodash');

const logger = require('./lib/logger');
const helpers = require('./lib/helpers');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');
const chargeVersionService = require('../services/charge-version-service');
const chargeVersionYearService = require('../services/charge-version-year');
const JOB_NAME = 'billing.populate-batch-charge-versions.*';

const queue = new Bull(JOB_NAME);

const processChargeVersionYearJob = require('./process-charge-version-year');

/**
 * Publishes a new 'populate batch charge versions' job on the queue
 * @param {Object} data
 */
const publish = data => queue.add(data, {
  jobId: helpers.createJobId(JOB_NAME, data.batch)
});

/**
 * Job handler - populates charge versions for billing batch
 * @param {Object} job
 * @param {Object} job.batch
 */
const jobHandler = async job => {
  logger.logHandling(job);

  // Populate water.billing_batch_charge_versions
  const batchId = get(job, 'data.batch.id');
  const batch = await batchService.getBatchById(batchId);
  await chargeVersionService.createForBatch(batch);

  // Populate water.billing_batch_charge_version_years
  const chargeVersionYears = await chargeVersionYearService.createForBatch(batch);

  return {
    batch,
    chargeVersionYears
  };
};

const completedHandler = async (job, result) => {
  logger.logCompleted(job);

  const { chargeVersionYears } = result;

  // Handle empty batch
  if (chargeVersionYears.length === 0) {
    await batchService.setStatusToEmptyWhenNoTransactions();
  } else {
    for (const chargeVersionYear of chargeVersionYears) {
      // Publish new jobs for each charge version year in the batch to process
      await processChargeVersionYearJob.publish({
        ...job.data,
        batch: result.batch,
        chargeVersionYear
      });
    }
  }
};

const failedHandler = helpers.createFailedHandler(BATCH_ERROR_CODE.failedToPopulateChargeVersions);

// Set up queue
queue.process(jobHandler);
queue.on('completed', completedHandler);
queue.on('failed', failedHandler);

exports.jobHandler = jobHandler;
exports.failedHandler = failedHandler;
exports.publish = publish;
exports.JOB_NAME = JOB_NAME;
