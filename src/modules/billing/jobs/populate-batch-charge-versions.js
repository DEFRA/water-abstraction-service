'use strict';

const { get } = require('lodash');

const evt = require('../../../lib/event');
const { chargeVersions } = require('../../../lib/connectors/repository');

const JOB_NAME = 'billing.populate-batch-charge-versions';

const { logger } = require('../../../logger');

const { isAnnualBatch, isTwoPartTariffBatch, isSupplementaryBatch } = require('../lib/batch');

const createMessage = (eventId, batch) => ({
  name: JOB_NAME,
  data: {
    eventId,
    batch
  }
});

const getChargeVersionRows = async batch => {
  logger.info(`Getting charge version rows for Batch of type ${batch.batch_type}`);

  if (isAnnualBatch(batch)) {
    return chargeVersions.createAnnualChargeVersions(batch);
  }

  if (isSupplementaryBatch(batch)) {
    return chargeVersions.createSupplementaryChargeVersions(batch);
  }

  if (isTwoPartTariffBatch(batch)) {
    return chargeVersions.createTwoPartTariffChargeVersions(batch);
  }
};

const handlePopulateBatch = async job => {
  logger.info(`Handling ${JOB_NAME}`);

  const eventId = get(job, 'data.eventId');
  const batchEvent = await evt.load(eventId);
  const { batch } = batchEvent.metadata;

  const rows = await getChargeVersionRows(batch);

  // Include the charge versions in the response data. This information
  // can then be used in the onComplete callback to decide if a new job
  // should be published.
  return { chargeVersions: rows, batch };
};

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
