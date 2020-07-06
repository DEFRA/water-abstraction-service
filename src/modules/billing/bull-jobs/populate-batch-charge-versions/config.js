'use strict';

const path = require('path');

const logger = require('../lib/logger');
const helpers = require('../lib/helpers');

const { BATCH_ERROR_CODE } = require('../../../../lib/models/batch');
const batchService = require('../../services/batch-service');
const JOB_NAME = 'billing.populate-batch-charge-versions.*';

const processChargeVersionYearJob = require('../process-charge-version-year');

/**
 * Publishes a new 'populate batch charge versions' job on the queue
 * @param {Object} data
 */
const createMessage = data => ({
  data,
  options: {
    jobId: helpers.createJobId(JOB_NAME, data.batch)
  }
});

const completedHandler = async (job, result) => {
  logger.logCompleted(job);

  const { batch, chargeVersionYears } = result;

  // Handle empty batch
  if (chargeVersionYears.length === 0) {
    await batchService.setStatusToEmptyWhenNoTransactions(batch);
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

const failedHandler = helpers.createFailedHandler(JOB_NAME, BATCH_ERROR_CODE.failedToPopulateChargeVersions);

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.processor = (path.join(__dirname, './processor.js'));
exports.onComplete = completedHandler;
exports.onFailed = failedHandler;
