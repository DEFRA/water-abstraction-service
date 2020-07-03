const { get } = require('lodash');

const transactionsService = require('../../services/transactions-service');
const logger = require('../lib/logger');
const mappers = require('../../mappers');
const chargeModuleBillRunConnector = require('../../../../lib/connectors/charge-module/bill-runs');

/**
 * Job handler - creates bill run in charge module
 * @param {Object} job
 * @param {Object} job.batch
 */
const jobHandler = async job => {
  logger.logHandling(job);

  const transactionId = get(job, 'data.transaction.billingTransactionId');

  // Create batch model from loaded data
  const batch = await transactionsService.getById(transactionId);

  const transaction = get(batch, 'invoices[0].invoiceLicences[0].transactions[0]');
  if (!transaction.isCandidate()) {
    return logger.logInfo(job, 'Transaction already processed');
  }

  // Map data to charge module transaction
  const [cmTransaction] = mappers.batch.modelToChargeModule(batch);

  // Create transaction in Charge Module
  const response = await chargeModuleBillRunConnector.addTransaction(batch.externalId, cmTransaction);

  // Update/remove our local transaction in water.billing_transactions
  await transactionsService.updateWithChargeModuleResponse(transactionId, response);
};

module.exports = jobHandler;
