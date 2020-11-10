'use strict';

const { get } = require('lodash');
const transactionsService = require('../services/transactions-service');
const batchService = require('../services/batch-service');

const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');
const mappers = require('../mappers');
const batchJob = require('./lib/batch-job');
const { BATCH_ERROR_CODE } = require('../../../lib/models/batch');

const JOB_NAME = 'billing.create-charge.*';

const options = {
  teamSize: 50,
  teamConcurrency: 2
};

/**
 * Checks if the error is an HTTP client error (in range 400 - 499)
 * @param {Error} err
 * @return {Boolean}
 */
const isClientError = err => {
  const statusCode = get(err, 'statusCode', 0);
  return (statusCode >= 400) && (statusCode < 500);
};

/**
 * Creates an object ready to publish on the message queue
 *
 * @param {String} eventId The UUID of the event
 * @param {Object} batch The object from the batch database table
 * @param {Object} transaction The transaction to create
 */
const createMessage = (eventId, batch, transaction) => {
  return batchJob.createMessage(JOB_NAME, batch, { transaction, eventId }, {
    singletonKey: transaction.billing_transaction_id
  });
};

const handleCreateCharge = async job => {
  batchJob.logHandling(job);

  const transactionId = get(job, 'data.transaction.billing_transaction_id');
  const batchId = get(job, 'data.batch.id');

  try {
    // Create batch model from loaded data
    const batch = await transactionsService.getById(transactionId);

    // Map data to charge module transaction
    const [cmTransaction] = mappers.batch.modelToChargeModule(batch);

    // Create transaction in Charge Module
    const response = await chargeModuleBillRunConnector.addTransaction(batch.externalId, cmTransaction);

    // Update/remove our local transaction in water.billing_transactions
    await transactionsService.updateWithChargeModuleResponse(transactionId, response);
  } catch (err) {
    // Always log and mark transaction as errored in DB
    transactionsService.setErrorStatus(transactionId);
    batchJob.logHandlingError(job, err);

    // If not a client error, error the batch
    if (!isClientError(err)) {
      await batchService.setErrorStatus(batchId, BATCH_ERROR_CODE.failedToCreateCharge);
      throw err;
    }
  }

  return {
    batch: job.data.batch
  };
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handleCreateCharge;
exports.options = options;
