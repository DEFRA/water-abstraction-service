'use strict';

const { get } = require('lodash');
const Transaction = require('../../../lib/models/transaction');
const transactionsService = require('../services/transactions-service');
const chargeModuleTransactions = require('../../../lib/connectors/charge-module/transactions');
const repos = require('../../../lib/connectors/repository');
const mappers = require('../mappers');
const batchJob = require('./lib/batch-job');

const JOB_NAME = 'billing.create-charge.*';

const options = {
  teamSize: 10
};

/**
 * Creates an object ready to publish on the message queue
 *
 * @param {String} eventId The UUID of the event
 * @param {Object} batch The object from the batch database table
 * @param {Object} transaction The transaction to create
 */
const createMessage = (eventId, batch, transaction) => {
  return batchJob.createMessage(JOB_NAME, batch, { transaction, eventId });
};

const handleCreateCharge = async job => {
  batchJob.logHandling(job);

  const transactionId = get(job, 'data.transaction.billing_transaction_id');

  try {
    // Create batch model from loaded data
    const batch = await transactionsService.getById(transactionId);

    // Map data to charge module transaction
    const [cmTransaction] = mappers.batch.modelToChargeModule(batch);

    // Create transaction in Charge Module
    const response = await chargeModuleTransactions.createTransaction(cmTransaction);
    const externalId = get(response, 'transaction.id');

    // Update status
    await repos.billingTransactions.setStatus(transactionId, Transaction.statuses.chargeCreated, externalId);
  } catch (err) {
    batchJob.logHandlingError(job, err);

    // Mark transaction as error in DB
    repos.billingTransactions.setStatus(job.data.transaction.billing_transaction_id, Transaction.statuses.error);
    throw err;
  }

  return {
    batch: job.data.batch
  };
};

exports.jobName = JOB_NAME;
exports.createMessage = createMessage;
exports.handler = handleCreateCharge;
exports.options = options;
