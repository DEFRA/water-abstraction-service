'use strict';

const { uniq, groupBy, find } = require('lodash');

const chargeModuleTransactionsConnector = require('../../../lib/connectors/charge-module/transactions');
const ChargeModuleTransaction = require('../../../lib/models/charge-module-transaction');
const crmV2Connector = require('../../../lib/connectors/crm-v2');
const { logger } = require('../../../logger');
const repos = require('../../../lib/connectors/repository');
const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');
const batchService = require('./batch-service');

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

/**
 * Builds an index where the most recent transaction with a given key
 * can be found, since the transactions are already sorted by dateCreated
 * @param {Array} transactions
 * @return {Object}
 */
const indexByTransactionKey = transactions => transactions.reduce((acc, transaction) => {
  return {
    ...acc,
    [transaction.transactionKey]: transaction
  };
}, {});

/**
 * Given the batch/historical transaction indexes:
 *
 * ╔══════════════════════════════════╤════════════════════════╤═══════════════╗
 * ║ List A (historical transactions) │ List B (current batch) │ Action        ║
 * ╠══════════════════════════════════╪════════════════════════╪═══════════════╣
 * ║ -                                │ Charge                 │ -             ║
 * ╟──────────────────────────────────┼────────────────────────┼───────────────╢
 * ║ Charge                           │ Charge                 │ Delete from B ║
 * ╟──────────────────────────────────┼────────────────────────┼───────────────╢
 * ║ Credit                           │ Charge                 │ -             ║
 * ╟──────────────────────────────────┼────────────────────────┼───────────────╢
 * ║ Charge                           │ -                      │ Credit in B   ║
 * ╟──────────────────────────────────┼────────────────────────┼───────────────╢
 * ║ Credit                           │ -                      │ -             ║
 * ╚══════════════════════════════════╧════════════════════════╧═══════════════╝
 *
 * @param {Object} indexes
 * @return {Object} - { delete : [...transactionIds], credit : [...transactionIds] }
 */
const getSupplementaryActions = indexes => {
  const allKeys = [...Object.keys(indexes.batch), ...Object.keys(indexes.historical)];
  const skeleton = {
    delete: [],
    credit: []
  };

  return uniq(allKeys).reduce((acc, key) => {
    const existsInNewBatch = key in indexes.batch;
    const isExistingCharge = (key in indexes.historical) && (indexes.historical[key].isCredit === false);

    if (isExistingCharge && existsInNewBatch) {
      acc.delete.push(indexes.batch[key].billingTransactionId);
    }
    if (isExistingCharge && !existsInNewBatch) {
      acc.credit.push(indexes.historical[key].billingTransactionId);
    }
    return acc;
  }, skeleton);
};

const getInvoiceAccountId = billingTransaction =>
  billingTransaction.billingInvoiceLicence.billingInvoice.invoiceAccountId;

const getUniqueInvoiceAccountIds = transactions => {
  const ids = transactions.map(getInvoiceAccountId);
  return uniq(ids);
};

const decorateBatchWithInvoices = async (batch, transactions) => {
  const invoiceAccountIds = getUniqueInvoiceAccountIds(transactions);

  // Load invoice account data from CRM
  const invoiceAccounts = await crmV2Connector.invoiceAccounts.getInvoiceAccountsByIds(invoiceAccountIds);

  // Add invoices to batch
  batch.invoices = invoiceAccounts.map(mappers.invoice.crmToModel);

  return batch;
};

const getLicenceGroup = row =>
  [
    row.billingInvoiceLicence.companyId,
    row.billingInvoiceLicence.contactId,
    row.billingInvoiceLicence.addressId,
    row.billingInvoiceLicence.licence.licenceRef,
    row.billingInvoiceLicence.billingInvoice.invoiceAccountId
  ].join(':');

const decorateBatchWithLicences = (batch, transactions) => {
  const groups = groupBy(transactions, getLicenceGroup);

  Object.values(groups).forEach(transactions => {
    // Create InvoiceLicence and map transactions
    const invoiceLicence = mappers.invoiceLicence.dbToModel(transactions[0].billingInvoiceLicence);
    invoiceLicence.transactions = transactions.map(mappers.transaction.dbToCreditModel);

    // Append to correct invoice in batch
    const invoice = find(batch.invoices,
      invoice => invoice.invoiceAccount.id === getInvoiceAccountId(transactions[0])
    );
    invoice.invoiceLicences.push(invoiceLicence);
  });
};

const addCreditsToBatch = async (batchId, transactionIds) => {
  if (transactionIds.length === 0) {
    return;
  }

  // Get current batch and list of credit transactions with relations
  const [batch, transactions] = await Promise.all([
    batchService.getBatchById(batchId),
    newRepos.billingTransactions.find(transactionIds)
  ]);

  await decorateBatchWithInvoices(batch, transactions);
  decorateBatchWithLicences(batch, transactions);

  console.log(JSON.stringify(batch, null, 2));
};

const processSupplementary = async batchId => {
  // Loads:
  // - transactions in current batch
  // - historical transactions relating to licences in current batch
  const [batchTransactions, historicalTransactions] = await Promise.all([
    newRepos.billingTransactions.findByBatchId(batchId),
    newRepos.billingTransactions.findHistoryByBatchId(batchId)
  ]);

  // Create indexes on the unique transaction keys
  const indexes = {
    batch: indexByTransactionKey(batchTransactions),
    historical: indexByTransactionKey(historicalTransactions)
  };

  // Create a list of delete/credit actions required
  const actions = getSupplementaryActions(indexes);

  await Promise.all([
    newRepos.billingTransactions.delete(actions.delete),
    addCreditsToBatch(batchId, actions.credit)
  ]);

  // @TODO clean batch - remove any licences/invoices with zero children
};

exports.getTransactionsForBatch = getTransactionsForBatch;
exports.getTransactionsForBatchInvoice = getTransactionsForBatchInvoice;
exports.saveTransactionToDB = saveTransactionToDB;
exports.getById = getById;
exports._getSupplementaryActions = getSupplementaryActions;
exports.processSupplementary = processSupplementary;
