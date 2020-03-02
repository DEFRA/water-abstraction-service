'use strict';

const { jobStatus } = require('../lib/batch');
const { BATCH_STATUS } = require('../../../lib/models/batch');

const eventService = require('../../../lib/services/events');
const batchService = require('./batch-service');

const setStatuses = (eventId, eventStatus, batchId, batchStatus) => {
  return Promise.all([
    eventService.updateStatus(eventId, eventStatus),
    batchService.setStatus(batchId, batchStatus)
  ]);
};

const setReadyJob = (eventId, batchId) =>
  setStatuses(eventId, jobStatus.complete, batchId, BATCH_STATUS.ready);

const setFailedJob = (eventId, batchId) =>
  setStatuses(eventId, jobStatus.error, batchId, BATCH_STATUS.error);

exports.setReadyJob = setReadyJob;
exports.setFailedJob = setFailedJob;
