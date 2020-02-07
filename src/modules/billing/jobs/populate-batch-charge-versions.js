'use strict';

const { get } = require('lodash');
const evt = require('../../../lib/event');
const { chargeVersions } = require('../../../lib/connectors/repository');

const JOB_NAME = 'billing.populate-batch-charge-versions';

const { isSupplementaryBatch } = require('../lib/batch');
const { logger } = require('../../../logger');

const createMessage = (eventId, batch) => ({
  name: JOB_NAME,
  data: {
    eventId,
    batch
  }
});

/**
 * Handles a batch that is supplementary
 *
 * @param {Object} job PG-Boss job object
 * @param {Object} batch The batch run
 */
const handleSupplementaryBatch = async (batch) => {
  logger.info('Handling supplementary batch', batch);

  // move any found charge versions into water.billing_batch_charge_versions
  const rows = await chargeVersions.createSupplementaryChargeVersions(batch);

  // Include the charge versions in the response data. This information
  // can then be used in the onComplete callback to decide if a new job
  // should be published.
  return { chargeVersions: rows, batch };
};

const handlePopulateBatch = async job => {
  logger.info(`Handling ${JOB_NAME}`);

  const eventId = get(job, 'data.eventId');
  const batchEvent = await evt.load(eventId);
  const { batch } = batchEvent.metadata;

  if (isSupplementaryBatch(batch)) {
    return handleSupplementaryBatch(batch);
  }

  logger.info('handle annual batches in a future story');
};

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
