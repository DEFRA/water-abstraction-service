'use strict';

const evt = require('../../../lib/event');
const service = require('../service');
const chargeVersionYearService = require('../services/charge-version-year');
const { logger } = require('../../../logger');

const JOB_NAME = 'billing.process-charge-version';

const options = {
  teamSize: 10
};

const createMessage = (eventId, chargeVersionYear) => ({
  name: JOB_NAME,
  data: { eventId, chargeVersionYear }
});

const handleProcessChargeVersion = async job => {
  logger.info(`Handling ${JOB_NAME}`);

  const { eventId, chargeVersionYear } = job.data;

  // Process charge version year
  try {
    const batchEvent = await evt.load(eventId);

    // Create batch model
    const batch = await service.chargeVersionYear.createBatchFromChargeVersionYear(chargeVersionYear);

    // Persist data
    await service.chargeVersionYear.persistChargeVersionYearBatch(batch);

    // Update status in water.billing_batch_charge_version_year
    await chargeVersionYearService.setReadyStatus(chargeVersionYear.billing_batch_charge_version_year_id);

    return {
      chargeVersionYear,
      batch: batchEvent.metadata.batch
    };
  } catch (err) {
    logger.error('Error processing charge version year', err, {
      eventId,
      chargeVersionYear
    });
    // Mark as error
    await chargeVersionYearService.setErrorStatus(chargeVersionYear.billing_batch_charge_version_year_id);
    // Rethrow
    throw err;
  }
};

exports.createMessage = createMessage;
exports.handler = handleProcessChargeVersion;
exports.jobName = JOB_NAME;
exports.options = options;
