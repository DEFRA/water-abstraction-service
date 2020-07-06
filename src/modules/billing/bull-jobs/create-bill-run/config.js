'use strict';

const path = require('path');

const logger = require('../lib/logger');
const helpers = require('../lib/helpers');

const { BATCH_ERROR_CODE } = require('../../../../lib/models/batch');

const JOB_NAME = 'billing.create-bill-run.*';

const populateBatchChargeVersionsJob = require('../populate-batch-charge-versions');

/**
 * Publishes a new 'create bill run' job on the queue
 * @param {Object} batch
 */
const createMessage = (batch, eventId) => ({
  data: {
    batch,
    eventId
  },
  options: {
    jobId: helpers.createJobId(JOB_NAME, batch)
  }
});

const completedHandler = async (job, result) => {
  logger.logCompleted(job);
  populateBatchChargeVersionsJob.publish({
    ...job.data,
    ...result
  });
};

const failedHandler = helpers.createFailedHandler(JOB_NAME, BATCH_ERROR_CODE.failedToCreateBillRun);

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.processor = (path.join(__dirname, './processor.js'));
exports.onComplete = completedHandler;
exports.onFailed = failedHandler;
