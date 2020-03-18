'use strict';

const chargeModuleTransactionsConnector = require('../../../lib/connectors/charge-module/transactions');
const ChargeModuleTransaction = require('../../../lib/models/charge-module-transaction');
const Transaction = require('../../../lib/models/transaction');

const { logger } = require('../../../logger');
const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');
const { get } = require('lodash');

const mapTransaction = chargeModuleTransaction => {
  const transaction = new ChargeModuleTransaction(chargeModuleTransaction.id);
  transaction.licenceNumber = chargeModuleTransaction.licenceNumber;
  transaction.accountNumber = chargeModuleTransaction.customerReference;
  transaction.isCredit = chargeModuleTransaction.credit;
  transaction.value = chargeModuleTransaction.chargeValue;
  return transaction;
};

const mapTransactions = chargeModuleTransactions => chargeModuleTransactions.map(mapTransaction);

/**
 * Gets transactions from the charge module for the given batch id
 *
 * @param {String} batchId uuid of the batch to get the charge module transactions for
 * @returns {Array<ChargeModuleTransaction>} A list of charge module transactions
 */
const getTransactionsForBatch = async batchId => {
  try {
    const { data } = await chargeModuleTransactionsConnector.getTransactionQueue(batchId);
    return mapTransactions(data.transactions);
  } catch (err) {
    logger.error('Cannot get transactions from charge module', err);

    // temporary behaviour whilst full intgration is made with charging api
    return [];
  }
};

/**
 * Gets transactions from the charge module for the given invoice and batch id
 *
 * @param {String} batchId uuid of the batch to get the charge module transactions for
 * @returns {Array<ChargeModuleTransaction>} A list of charge module transactions
 */
const getTransactionsForBatchInvoice = async (batchId, invoiceReference) => {
  try {
    const { data } = await chargeModuleTransactionsConnector.getTransactionQueue(batchId, invoiceReference);
    return mapTransactions(data.transactions);
  } catch (err) {
    logger.error('Cannot get transactions from charge module', err);

    // temporary behaviour whilst full intgration is made with charging api
    return [];
  }
};

/**
 * Saves a row to water.billing_transactions for the given Transaction
 * instance
 * @param {InvoiceLicence} invoiceLicence
 * @param {Transaction} transaction
 * @return {Promise}
 */
const saveTransactionToDB = (invoiceLicence, transaction) => {
  const data = mappers.transaction.modelToDb(invoiceLicence, transaction);
  return newRepos.billingTransactions.create(data);
};

/**
 * Gets a transaction in its context within a batch
 * @param {String} transactionId
 * @return {Promise<Batch>}
 */
const getById = async transactionId => {
  const data = await newRepos.billingTransactions.findOne(transactionId);

  // Create models
  const batch = mappers.batch.dbToModel(data.billingInvoiceLicence.billingInvoice.billingBatch);
  const invoice = mappers.invoice.dbToModel(data.billingInvoiceLicence.billingInvoice);
  const invoiceLicence = mappers.invoiceLicence.dbToModel(data.billingInvoiceLicence);
  const licence = mappers.licence.dbToModel(data.billingInvoiceLicence.licence);
  const transaction = mappers.transaction.dbToModel(data);

  // Place in heirarchy
  invoiceLicence.transactions = [transaction];
  invoice.invoiceLicences = [invoiceLicence];
  invoiceLicence.licence = licence;
  batch.invoices = [
    invoice
  ];

  return batch;
};

/**
 * Updates a transaction using the response from the Charge Module
 * create charge API endpoint
 * Either:
 * - the transaction is created successfully, in which case
 *   the charge module transaction ID is stored
 * - a zero value charge is calculated, in which case the
 *   transaction is deleted.
 *
 * @param {String} transactionId
 * @param {Object} response
 */
const updateTransactionWithChargeModuleResponse = (transactionId, response) => {
  const externalId = get(response, 'transaction.id');
  if (externalId) {
    return newRepos.billingTransactions.update(transactionId, {
      status: Transaction.statuses.chargeCreated,
      externalId
    });
  }
  if (get(response, 'status') === 'Zero value charge calculated') {
    return newRepos.billingTransactions.delete(transactionId);
  }
  const err = new Error('Charge module error');
  logger.error('Unexpected create transaction response from charge module', err, { transactionId, response });
  throw err;
};

const setErrorStatus = transactionId =>
  newRepos.billingTransactions.update(transactionId, {
    status: Transaction.statuses.error
  });

exports.getTransactionsForBatch = getTransactionsForBatch;
exports.getTransactionsForBatchInvoice = getTransactionsForBatchInvoice;
exports.saveTransactionToDB = saveTransactionToDB;
exports.getById = getById;
exports.updateWithChargeModuleResponse = updateTransactionWithChargeModuleResponse;
exports.setErrorStatus = setErrorStatus;
