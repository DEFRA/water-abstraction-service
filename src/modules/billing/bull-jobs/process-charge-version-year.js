const Bull = require('bull');

const logger = require('./lib/logger');
const helpers = require('./lib/helpers');

const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');
const chargeVersionYearService = require('../services/charge-version-year');
const billingVolumesService = require('../services/billing-volumes-service');

const prepareTransactionsJob = require('./prepare-transactions');

const JOB_NAME = 'billing.process-charge-version-year.*';

const queue = new Bull(JOB_NAME);

/**
 * Publishes a new 'process charge version year' job on the queue
 * @param {Object} data
 */
const publish = data => queue.add(data, {
  jobId: helpers.createJobId(JOB_NAME, data.batch, data.chargeVersionYear.billingBatchChargeVersionYearId)
});

/**
 * Job handler - processes charge version for a particular financial year
 * @param {Object} job
 * @param {Object} job.batch
 */
const jobHandler = async job => {
  logger.logHandling(job);

  const { chargeVersionYear } = job.data;

  const batch = await chargeVersionYearService.processChargeVersionYear(chargeVersionYear);

  // Persist data
  await batchService.saveInvoicesToDB(batch);

  // Update status in water.billing_batch_charge_version_year
  await chargeVersionYearService.setReadyStatus(chargeVersionYear.billingBatchChargeVersionYearId);
};

const completedHandler = async (job, result) => {
  logger.logCompleted(job);

  const { batch } = job.data;

  const statusCounts = await chargeVersionYearService.getStatusCounts(batch.id);

  if (statusCounts.processing === 0) {
    logger.logInfo(job, 'No more charge version year entries to process');

    // Check if any un-approved billing volumes in batch - if so we go to TPT review stage
    const numberOfUnapprovedBillingVolumes = await billingVolumesService.getUnapprovedVolumesForBatchCount(batch);

    if (numberOfUnapprovedBillingVolumes > 0) {
      return batchService.setStatus(batch.id, BATCH_STATUS.review);
    }

    // Otherwise continue to prepare transactions
    await prepareTransactionsJob.publish({ batch });
  }

  logger.logInfo(job, `Processing: ${statusCounts.processing} Ready:  ${statusCounts.ready} `);
};

const failedHandler = helpers.createFailedHandler(BATCH_ERROR_CODE.failedToProcessChargeVersions, queue, JOB_NAME);

// Set up queue
queue.process(jobHandler);
queue.on('completed', completedHandler);
queue.on('failed', failedHandler);

exports.jobHandler = jobHandler;
exports.failedHandler = failedHandler;
exports.publish = publish;
exports.JOB_NAME = JOB_NAME;
