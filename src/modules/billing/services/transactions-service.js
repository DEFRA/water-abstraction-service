'use strict';

const chargeModuleTransactionsConnector = require('../../../lib/connectors/charge-module/transactions');
const ChargeModuleTransaction = require('../../../lib/models/charge-module-transaction');
const { logger } = require('../../../logger');
const repos = require('../../../lib/connectors/repository');
const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');

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
  return repos.billingTransactions.create(data);
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

exports.getTransactionsForBatch = getTransactionsForBatch;
exports.getTransactionsForBatchInvoice = getTransactionsForBatchInvoice;
exports.saveTransactionToDB = saveTransactionToDB;
exports.getById = getById;
