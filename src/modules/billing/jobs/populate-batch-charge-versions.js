'use strict';

const { get } = require('lodash');

const { chargeVersions } = require('../../../lib/connectors/repository');
const { isAnnualBatch, isTwoPartTariffBatch, isSupplementaryBatch } = require('../lib/batch');
const batchJob = require('./lib/batch-job');
const { logger } = require('../../../logger');

const JOB_NAME = 'billing.populate-batch-charge-versions.*';

const createMessage = (eventId, batch) => {
  return batchJob.createMessage(JOB_NAME, batch, { eventId });
};

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
  batchJob.logHandling(job);

  const batch = get(job, 'data.batch');
  const rows = await getChargeVersionRows(batch);

  // Include the charge versions in the response data. This information
  // can then be used in the onComplete callback to decide if a new job
  // should be published.
  return { chargeVersions: rows, batch };
};

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
