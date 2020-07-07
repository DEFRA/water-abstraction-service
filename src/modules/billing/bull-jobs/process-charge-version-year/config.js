'use strict';

const path = require('path');

const logger = require('../lib/logger');
const helpers = require('../lib/helpers');

const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../../lib/models/batch');
const batchService = require('../../services/batch-service');
const chargeVersionYearService = require('../../services/charge-version-year');
const billingVolumesService = require('../../services/billing-volumes-service');

const prepareTransactionsJob = require('../prepare-transactions');

const JOB_NAME = 'billing.process-charge-version-year.*';

/**
 * Creates a message for a new 'process charge version year' job on the queue
 * @param {Object} data
 * @return {Object}
 */
const createMessage = data => helpers.createMessage(JOB_NAME, data,
  helpers.createJobId(JOB_NAME, data.batch, data.chargeVersionYear.billingBatchChargeVersionYearId)
);

const completedHandler = async (job, result) => {
  logger.logCompleted(job);

  const { batch } = job.data;

  const statusCounts = await chargeVersionYearService.getStatusCounts(batch.id);

  if (statusCounts.processing === 0) {
    logger.logInfo(job, 'No more charge version year entries to process');

    // Check if any un-approved billing volumes in batch - if so we go to TPT review stage
    const numberOfUnapprovedBillingVolumes = await billingVolumesService.getUnapprovedVolumesForBatchCount(batch);

    if (numberOfUnapprovedBillingVolumes > 0) {
      // Move to two-part tariff stage if any unapproved billing volumes in batch
      await batchService.setStatus(batch.id, BATCH_STATUS.review);
    } else {
      // Otherwise continue to prepare transactions
      await prepareTransactionsJob.publish({ batch });
    }

    return;
  }

  logger.logInfo(job, `Processing: ${statusCounts.processing} Ready:  ${statusCounts.ready} `);
};

const failedHandler = helpers.createFailedHandler(JOB_NAME, BATCH_ERROR_CODE.failedToProcessChargeVersions);

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.processor = (path.join(__dirname, './processor.js'));
exports.onComplete = completedHandler;
exports.onFailed = failedHandler;
