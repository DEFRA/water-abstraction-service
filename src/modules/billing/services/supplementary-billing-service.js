'use strict';

const { uniq, groupBy, find } = require('lodash');

const newRepos = require('../../../lib/connectors/repos');
const crmV2Connector = require('../../../lib/connectors/crm-v2');
const mappers = require('../mappers');
const batchService = require('./batch-service');

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
    invoiceLicence.transactions = transactions.map(
      row => mappers.transaction.dbToModel(row).toCredit()
    );

    // Append to correct invoice in batch
    const invoice = find(batch.invoices,
      invoice => invoice.invoiceAccount.id === getInvoiceAccountId(transactions[0])
    );
    invoice.invoiceLicences.push(invoiceLicence);
  });
};

/**
 * @param {Strign} batchId
 * @param {Array<String>} transactionIds
 * @return {Promise}
 */
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

  // Persist batch
  return batchService.saveInvoicesToDB(batch);
};

/**
 * Processes the supplementary billing batch specified by
 * deleting some transactions in the batch and crediting others
 * previously billed
 * @param {String} batchId
 * @reutrn {Promise}
 */
const processBatch = async batchId => {
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
};

exports.processBatch = processBatch;
