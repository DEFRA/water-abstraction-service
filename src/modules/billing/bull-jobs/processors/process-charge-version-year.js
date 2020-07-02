const chargeVersionYearService = require('../../services/charge-version-year');
const batchService = require('../../services/batch-service');

const logger = require('../lib/logger');

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

module.exports = jobHandler;
