const { jobStatus } = require('../lib/batch');
const repos = require('../../../lib/connectors/repository');
const service = require('../service');

const JOB_NAME = 'billing.process-charge-version';

const { logger } = require('../../../logger');

const createMessage = (eventId, chargeVersionYear) => ({
  name: JOB_NAME,
  data: { eventId, chargeVersionYear }
});

const handleProcessChargeVersion = async job => {
  logger.info(`Handling ${JOB_NAME}`);

  // temporary implementation here just sets the required statuses
  // to completed so future jobs can be queued
  const { eventId, chargeVersionYear } = job.data;

  // Process charge version year
  try {
    // Create batch model
    const batch = await service.chargeVersionYear.createBatchFromChargeVersionYear(chargeVersionYear);
    // Persist data
    await service.chargeVersionYear.persistChargeVersionYearBatch(batch);
    // Update status in water.billing_batch_charge_version_year
    await repos.billingBatchChargeVersionYears.setStatus(chargeVersionYear.billing_batch_charge_version_year_id, jobStatus.complete);
  } catch (err) {
    logger.error('Error processing charge version year', err, {
      eventId,
      chargeVersionYear
    });
    // Mark as error
    await repos.billingBatchChargeVersionYears.setStatus(chargeVersionYear.billing_batch_charge_version_year_id, jobStatus.error);
  }

  return job.done(null, {
    chargeVersionYear
  });
};

exports.createMessage = createMessage;
exports.handler = handleProcessChargeVersion;
exports.jobName = JOB_NAME;
