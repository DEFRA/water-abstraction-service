'use strict';

const { jobStatus } = require('../lib/event');
const { BATCH_STATUS } = require('../../../lib/models/batch');

const eventService = require('../../../lib/services/events');
const batchService = require('./batch-service');

const setStatuses = (eventId, eventStatus, batchId, batchStatus) => {
  return Promise.all([
    eventService.updateStatus(eventId, eventStatus),
    batchService.setStatus(batchId, batchStatus)
  ]);
};

/**
 * Sets the event/job to complete, and the batch to ready
 * @param {String} eventId
 * @param {String} batchId
 */
const setReadyJob = (eventId, batchId) =>
  setStatuses(eventId, jobStatus.complete, batchId, BATCH_STATUS.ready);

/**
 * Sets the event/job to complete, and the batch to empty
 * @param {String} eventId
 * @param {String} batchId
 */
const setEmptyBatch = (eventId, batchId) =>
  setStatuses(eventId, jobStatus.complete, batchId, BATCH_STATUS.empty);

/**
 * Sets the event/job to error, and the batch to error
 * @param {String} eventId
 * @param {String} batchId
 */
const setFailedJob = (eventId, batchId) =>
  setStatuses(eventId, jobStatus.error, batchId, BATCH_STATUS.error);

exports.setEmptyBatch = setEmptyBatch;
exports.setFailedJob = setFailedJob;
exports.setReadyJob = setReadyJob;
