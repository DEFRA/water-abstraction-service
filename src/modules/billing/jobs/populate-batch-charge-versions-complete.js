const { get } = require('lodash');
const repos = require('../../../lib/connectors/repository');

const populateBatchChargeVersions = require('./populate-batch-charge-versions');
const processChargeVersion = require('./process-charge-version');

const { logger } = require('../../../logger');

const { batchStatus } = require('../lib/batch');
const { FinancialYear } = require('../../../lib/models');
const { isValidForFinancialYear } = require('../lib/charge-version');
const jobService = require('../services/jobService');

/**
 * Create an object ready for saving to the
 * water.billng_batch_charge_version_years table that contains the
 * batch, charge version and financial year values for future processing.
 *
 * @param {Object} billingBatchChargeVersion Object representing the inclusion of a charge version in a batch
 * @param {Number} financialYearEnding The financial year value
 */
const createChargeVersionYear = async (billingBatchChargeVersion, financialYearEnding) => {
  const chargeVersionYear = {
    charge_version_id: billingBatchChargeVersion.charge_version_id,
    billing_batch_id: billingBatchChargeVersion.billing_batch_id,
    financial_year_ending: financialYearEnding,
    status: batchStatus.processing
  };

  const result = await repos.billingBatchChargeVersionYears.create(chargeVersionYear);
  return get(result, 'rows[0]', null);
};

/**
 * Publishes messages to the queue with the name billing.process-charge-version
 * for each charge version that is valid in any of the financial years.
 *
 * @param {Array} billingBatchChargeVersions The array of billingBatchChargeVersion rows
 * @param {Array} financialYears Array of objects representing financial years
 * @param {Object} messageQueue The PG-Boss message queue
 * @param {String} eventId The event id for use when publishing
 */
const processBillingBatchChargeVersions = async (billingBatchChargeVersions, financialYears, messageQueue, eventId) => {
  for (const billingBatchChargeVersion of billingBatchChargeVersions) {
    // load the charge version and publish for each year it is valid for
    const chargeVersion = await repos.chargeVersions.findOneById(billingBatchChargeVersion.charge_version_id);
    await publishForValidChargeVersion(chargeVersion, financialYears, billingBatchChargeVersion, messageQueue, eventId);
  }
};

/**
 * For a given charge version, check which financial years it is valid to bill for
 * and publish a billing.process-charge-version message for each occurance.
 *
 * @param {Object} chargeVersion The charge version loaded from the database
 * @param {Array} financialYears Array of objects representing financial years
 * @param {Object} billingBatchChargeVersion An object the maps a charge version to a batch
 * @param {Object} messageQueue The PG-Boss message queue
 * @param {String} eventId The event id used for publishing
 */
const publishForValidChargeVersion = async (chargeVersion, financialYears, billingBatchChargeVersion, messageQueue, eventId) => {
  for (const financialYear of financialYears) {
    if (isValidForFinancialYear(chargeVersion, financialYear)) {
      const chargeVersionYear = await createChargeVersionYear(billingBatchChargeVersion, financialYear.endYear);

      const message = processChargeVersion.createMessage(eventId, chargeVersionYear);
      await messageQueue.publish(message);
    }
  }
};

/**
 * Handles the response from populating the billing batch with charge versions and decides
 * whether or not to publish a new job to continue with the batch flow.
 *
 * If batch charge versions were created, then create the batch charge version year
 * entries and publish
 *
 * @param {Object} job PG Boss job (including response from populateBatchChargeVersions handler)
 */
const handlePopulateBatchChargeVersionsComplete = async (job, messageQueue) => {
  logger.info(`onComplete - ${populateBatchChargeVersions.jobName}`);

  const { chargeVersions: billingBatchChargeVersions, batch } = job.data.response;
  const { eventId } = job.data.request.data;

  if (billingBatchChargeVersions.length === 0) {
    return jobService.setCompletedJob(eventId, batch.billing_batch_id);
  }

  try {
    const financialYears = FinancialYear.getFinancialYears(batch.from_financial_year_ending, batch.to_financial_year_ending);
    await processBillingBatchChargeVersions(billingBatchChargeVersions, financialYears, messageQueue, eventId);
  } catch (err) {
    logger.error('Failed to create charge version years', err);
    throw err;
  }
};

module.exports = handlePopulateBatchChargeVersionsComplete;
