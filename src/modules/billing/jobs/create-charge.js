const { get } = require('lodash');
const { logger } = require('../../../logger');
const Transaction = require('../../../lib/models/transaction');
const transactionsService = require('../services/transactions-service');
const batchService = require('../services/batch-service');
const chargeElementsService = require('../services/charge-elements-service');
const invoiceLicencesService = require('../services/invoice-licences-service');
const invoiceService = require('../services/invoice-service');
const chargeModuleTransactions = require('../../../lib/connectors/charge-module/transactions');
const repos = require('../../../lib/connectors/repository');

const JOB_NAME = 'billing.create-charge';

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
const createMessage = (eventId, batch, transaction) => ({
  name: JOB_NAME,
  data: { eventId, batch, transaction }
});

/**
 * Loads the models needed for the job
 * @param {Object} job
 * @return {Object}
 */
const loadModels = async job => {
  const { transaction, batch } = job.data;

  const tasks = [
    chargeElementsService.getById(transaction.charge_element_id),
    invoiceLicencesService.getByTransactionId(transaction.billing_transaction_id),
    invoiceService.getByTransactionId(transaction.billing_transaction_id)
  ];

  const [chargeElement, invoiceLicence, invoice] = await Promise.all(tasks);

  return {
    invoiceLicence,
    invoice,
    transaction: transactionsService.mapDBToModel(transaction, chargeElement),
    batch: batchService.mapDBToModel(batch)
  };
};

const handleCreateCharge = async job => {
  logger.info(`Handling ${JOB_NAME}`);

  try {
    // Load service models
    const { batch, invoice, invoiceLicence, transaction } = await loadModels(job);

    // Map to Charge Module data packet
    const cmTransaction = transactionsService
      .mapModelToChargeModule(batch, invoice, invoiceLicence, transaction);

    // Create transaction in Charge Module
    const response = await chargeModuleTransactions.createTransaction(cmTransaction);
    const externalId = get(response, 'transaction.id');

    // Update status
    await repos.billingTransactions.setStatus(transaction.id, Transaction.statuses.chargeCreated, externalId);
  } catch (err) {
    // Log error
    logger.error(`${JOB_NAME} error`, err, {
      batch_id: job.data.batch.billing_batch_id,
      transaction_id: job.data.transaction.billing_transaction_id
    });
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
