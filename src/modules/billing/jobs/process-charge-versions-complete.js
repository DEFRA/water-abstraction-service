const repo = require('../../../lib/connectors/repository');

const processChargeVersions = require('./process-charge-versions');
const { logger } = require('../../../logger');
const { batchStatus } = require('../lib/batch');

const handleProcessChargeVersionsComplete = async job => {
  logger.info(`onComplete - ${processChargeVersions.jobName}`);

  const { chargeVersionYear } = job.data.response;
  const batchId = chargeVersionYear.billing_batch_id;

  const { rowCount } = await repo.billingBatchChargeVersionYears.findProcessingByBatch(batchId);

  if (rowCount === 0) {
    logger.info(`No more charge version year entries to process for batch: ${batchId}`);
    await repo.billingBatches.setStatus(batchId, batchStatus.complete);
  } else {
    logger.info(`${rowCount} items yet to be processed for batch ${batchId}`);
  }
};

module.exports = handleProcessChargeVersionsComplete;
