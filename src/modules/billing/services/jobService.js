const evt = require('../../../lib/event');
const { jobStatus, batchStatus } = require('../lib/batch');
const repos = require('../../../lib/connectors/repository');

const setStatuses = (eventId, eventStatus, batchId, batchStatus) => {
  return Promise.all([
    evt.updateStatus(eventId, eventStatus),
    repos.billingBatches.setStatus(batchId, batchStatus)
  ]);
};

const setCompletedJob = (eventId, batchId) =>
  setStatuses(eventId, jobStatus.complete, batchId, batchStatus.complete);

const setFailedJob = (eventId, batchId) =>
  setStatuses(eventId, jobStatus.error, batchId, batchStatus.error);

exports.setCompletedJob = setCompletedJob;
exports.setFailedJob = setFailedJob;
