'use strict';

const { get } = require('lodash');
const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');

const JOB_NAME = 'billing.create-bill-run.*';

/**
 * Creates an object ready to publish on the message queue
 *
 * @param {String} eventId The UUID of the event
 * @param {Object} batch The object from the batch database table
 * @param {Object} transaction The transaction to create
 */
const createMessage = (eventId, batch, transaction) => {
  return batchJob.createMessage(JOB_NAME, batch, { transaction, eventId }, {
    singletonKey: JOB_NAME.replace('*', batch.id)
  });
};

const handleCreateBillRun = async job => {
  batchJob.logHandling(job);

  const eventId = get(job, 'data.eventId');
  const batchId = get(job, 'data.batch.id');

  try {
    const batch = await batchService.createChargeModuleBillRun(batchId);

    return { batch, eventId };
  } catch (err) {
    batchJob.logHandlingError(job, err);

    throw err;
  }
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handleCreateBillRun;
