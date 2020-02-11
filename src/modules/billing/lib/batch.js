'use strict';

const batchTypes = {
  supplementary: 'supplementary',
  annual: 'annual',
  twoPartTariff: 'two_part_tariff'
};

const batchIsOfType = type => batch => batch.batch_type === type;

/**
 * Tests if the batch is supplementary
 *
 * @param {Object} batch The batch record from the database
 */
const isSupplementaryBatch = batchIsOfType(batchTypes.supplementary);

/**
 * Tests if the batch is annual
 *
 * @param {Object} batch The batch record from the database
 */
const isAnnualBatch = batchIsOfType(batchTypes.annual);

/**
 * Tests if the batch is two part tariff
 *
 * @param {Object} batch The batch record from the database
 */
const isTwoPartTariffBatch = batchIsOfType(batchTypes.twoPartTariff);

exports.batchTypes = batchTypes;
exports.isSupplementaryBatch = isSupplementaryBatch;
exports.isAnnualBatch = isAnnualBatch;
exports.isTwoPartTariffBatch = isTwoPartTariffBatch;

/**
 * Statuses that the event (water.events) can have
 */
exports.jobStatus = {
  start: 'start',
  complete: 'complete',
  processing: 'processing',
  error: 'error',
  deleted: 'deleted'
};
