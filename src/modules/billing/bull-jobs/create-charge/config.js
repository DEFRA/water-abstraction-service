'use strict';

const path = require('path');
const { get } = require('lodash');

const logger = require('../lib/logger');
const helpers = require('../lib/helpers');

const { BATCH_ERROR_CODE, BATCH_STATUS } = require('../../../../lib/models/batch');
const Transaction = require('../../../../lib/models/transaction');

const batchService = require('../../services/batch-service');

const refreshTotalsJob = require('../refresh-totals');

const JOB_NAME = 'billing.create-charge.*';

/**
 * Creates a message for a new 'create charge' job on the queue
 * @param {Object} batch
 */
const createMessage = data => helpers.createMessage(JOB_NAME, data,
  helpers.createJobId(JOB_NAME, data.batch, data.transaction.billingTransactionId)
);

const completedHandler = async (job, result) => {
  logger.logCompleted(job);

  const { batch } = job.data;

  const statuses = await batchService.getTransactionStatusCounts(batch.id);

  // Still processing transactions
  if (get(statuses, Transaction.statuses.candidate, 0) > 0) {
    return;
  }

  // Removes invoices/licences with no transactions
  await batchService.cleanup(batch.id);

  // @TODO Empty batch - note: once the charge module allows zero transactions
  // again, this step can be removed, as we should never have an
  // empty batch at this stage
  if (get(statuses, Transaction.statuses.chargeCreated, 0) === 0) {
    await batchService.setStatusToEmptyWhenNoTransactions(batch);
    return;
  }

  // Mark batch as ready
  await batchService.setStatus(batch.id, BATCH_STATUS.ready);

  // Refresh totals
  await refreshTotalsJob.publish({ batch });
};

const failedHandler = helpers.createFailedHandler(JOB_NAME, BATCH_ERROR_CODE.failedToCreateCharge);

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.processor = (path.join(__dirname, './processor.js'));
exports.onComplete = completedHandler;
exports.onFailed = failedHandler;
