'use strict';

const refreshTotalsJob = require('./refresh-totals');
const jobService = require('../services/job-service');

const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');
const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');
const Transaction = require('../../../lib/models/transaction');
const { get } = require('lodash');

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
  ready: 'status.ready'
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
 * publish the refresh totals job, and set batch ready status
 * @param {Object} job
 * @param {Object} messageQueue - PG boss instance
 * @return {Promise}
 */
const finaliseReadyBatch = async (job, messageQueue) => {
  const { eventId, batchId } = parseJob(job);
  await batchService.cleanup(batchId);
  await messageQueue.publish(refreshTotalsJob.createMessage(batchId));
  await jobService.setReadyJob(eventId, batchId);
  await batchJob.deleteOnCompleteQueue(job, messageQueue);
};

const actions = {
  [batchStatuses.processing]: doNothing,
  [batchStatuses.empty]: finaliseEmptyBatch,
  [batchStatuses.ready]: finaliseReadyBatch
};

const handleCreateChargeComplete = async (job, messageQueue) => {
  batchJob.logOnComplete(job);

  if (batchJob.hasJobFailed(job)) {
    return batchJob.failBatch(job, messageQueue, BATCH_ERROR_CODE.failedToCreateCharge);
  }

  const { batchId } = parseJob(job);

  try {
    const status = await getBatchProgressStatus(batchId);

    await actions[status](job, messageQueue);
  } catch (err) {
    batchJob.logOnCompleteError(job);
    await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToCreateCharge);
    throw err;
  }
};

module.exports = handleCreateChargeComplete;
