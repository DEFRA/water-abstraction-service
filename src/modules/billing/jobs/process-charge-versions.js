const evt = require('../../../lib/event');
const { jobStatus, batchStatus } = require('../lib/batch');
const repos = require('../../../lib/connectors/repository');

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

  const batchEvent = await evt.load(eventId);

  await repos.billingBatchChargeVersionYears.setStatus(chargeVersionYear.billing_batch_charge_version_year_id, batchStatus.complete);

  batchEvent.status = jobStatus.complete;
  await evt.save(batchEvent);

  return job.done(null, {
    chargeVersionYear
  });
};

exports.createMessage = createMessage;
exports.handler = handleProcessChargeVersion;
exports.jobName = JOB_NAME;
