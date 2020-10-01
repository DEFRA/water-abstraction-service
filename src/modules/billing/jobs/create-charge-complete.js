'use strict';

const refreshTotalsJob = require('./refresh-totals');
const jobService = require('../services/job-service');

const { BATCH_STATUS } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');
const Transaction = require('../../../lib/models/transaction');
const { get, partialRight } = require('lodash');
const { createOnCompleteHandler } = require('./lib/on-complete');

const options = {
  teamSize: 50,
  teamConcurrency: 2
};

/**
 * The current status of the batch - this is either:
 * - processing - there are still candidate transactions to process
 * - empty - there are no transactions in the batch following processing
 * - ready - there are no candidate transactions, and the batch is not empty
 * @type {Object}
 */
const batchStatuses = {
  processing: 'status.processing',
  empty: 'status.empty',
  ready: 'status.ready',
  error: 'status.error'
};

/**
 * Gets a status for the batch transaction processing progress
 * @param {String} batchId
 * @return {String} status string
 */
const getBatchProgressStatus = async batchId => {
  const statuses = await batchService.getTransactionStatusCounts(batchId);
  if (get(statuses, Transaction.statuses.candidate, 0) > 0) {
    return batchStatuses.processing;
  }
  if (get(statuses, Transaction.statuses.chargeCreated, 0) === 0) {
    return batchStatuses.empty;
  }
  if (get(statuses, Transaction.statuses.error, 0) > 0) {
    return batchStatuses.error;
  }
  return batchStatuses.ready;
};

/**
 * Parses useful data out of the PG boss job
 * @param {Object} job - the PG boss job
 * @return {Object}
 */
const parseJob = job => {
  const { eventId } = job.data.request.data;
  const { batch } = job.data.response;
  return {
    eventId,
    batch,
    batchId: batch.id
  };
};

/**
 * If batch is still processing, do nothing
 */
const doNothing = () => {};

/**
 * If batch is empty, clean up any unwanted invoices/invoice licences
 * and set the batch as empty status
 * @param {Object} job
 * @return {Promise}
 */
const finaliseEmptyBatch = async (job, messageQueue) => {
  const { eventId, batchId } = parseJob(job);
  await batchService.cleanup(batchId);
  await jobService.setEmptyBatch(eventId, batchId);
  await batchJob.deleteOnCompleteQueue(job, messageQueue);
};

/**
 * If batch is ready, clean up any unwanted invoices/invoice licences,
 * publish the refresh totals job
 * @param {Object} job
 * @param {Object} messageQueue - PG boss instance
 * @return {Promise}
 */
const finaliseReadyBatch = async (job, messageQueue) => {
  const { batchId } = parseJob(job);
  await batchService.cleanup(batchId);
  await messageQueue.publish(refreshTotalsJob.createMessage(batchId));
  await batchJob.deleteOnCompleteQueue(job, messageQueue);
};

const actions = {
  [batchStatuses.processing]: doNothing,
  [batchStatuses.error]: doNothing,
  [batchStatuses.empty]: finaliseEmptyBatch,
  [batchStatuses.ready]: finaliseReadyBatch
};

const handleCreateChargeComplete = async (job, messageQueue, batch) => {
  try {
    const status = await getBatchProgressStatus(batch.id);
    await actions[status](job, messageQueue);
  } catch (err) {
    batchJob.logOnCompleteError(job);
    throw err;
  }
};

module.exports = partialRight(createOnCompleteHandler, handleCreateChargeComplete, BATCH_STATUS.processing);
module.exports.options = options;
