'use strict';

const { get, partial } = require('lodash');

const JOB_NAME = 'billing.persist-invoice-numbers-and-totals';

const batchService = require('../services/batch-service');
const batchJob = require('./lib/batch-job');
const helpers = require('./lib/helpers');

const createMessage = partial(helpers.createMessage, JOB_NAME);

const handler = async job => {
  batchJob.logHandling(job);
  const batchId = get(job, 'data.batchId');

  try {
    const batch = await batchService.getBatchById(batchId);
    return batchService.persistInvoiceNumbersAndTotals(batch);
  } catch (err) {
    await batchJob.logHandlingError(job, err);
    throw err;
  }
};

const onComplete = async job => {
  batchJob.logOnComplete(job);
};

exports.handler = handler;
exports.onComplete = onComplete;
exports.onFailed = helpers.onFailedHandler;
exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
