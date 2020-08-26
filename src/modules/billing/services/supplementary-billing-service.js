'use strict';

const { uniq, groupBy } = require('lodash');
const { getFinancialYear } = require('@envage/water-abstraction-helpers').charging;

const newRepos = require('../../../lib/connectors/repos');
const crmV2Connector = require('../../../lib/connectors/crm-v2');
const mappers = require('../mappers');
const batchService = require('./batch-service');
const FinancialYear = require('../../../lib/models/financial-year');

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
    const isExistingDeMinimisCharge = (key in indexes.historicalDeMinimis);

    if (isExistingCharge && existsInNewBatch) {
      acc.delete.push(indexes.batch[key].billingTransactionId);
    }
    if (isExistingCharge && !existsInNewBatch && !isExistingDeMinimisCharge) {
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

/**
 * Finds or creates the Invoice model in the batch for the supplied invoice account
 * number and financial year ending
 * @param {Batch} batch
 * @param {String} invoiceAccountNumber
 * @param {Number} financialYearEnding
 * @param {Array} crmInvoiceAccounts
 * @return {Batch}
 */
const getOrCreateInvoice = (batch, invoiceAccountNumber, financialYearEnding, crmInvoiceAccounts) => {
  // Find existing invoice model in batch
  const financialYear = new FinancialYear(financialYearEnding);
  let invoice = batch.getInvoiceByAccountNumberAndFinancialYear(invoiceAccountNumber, financialYear);
  if (!invoice) {
    // If not found, create new invoice model using CRM data
    const crmInvoiceAccount = crmInvoiceAccounts.find(row => row.invoiceAccountNumber === invoiceAccountNumber);
    invoice = mappers.invoice.crmToModel(crmInvoiceAccount);
    invoice.financialYear = financialYear;
    batch.invoices.push(invoice);
  }
  return invoice;
};

/**
 * Finds or creates the InvoiceLicence model in the batch for the supplied invoice
 * and licence number
 * @param {Invoice} invoice
 * @param {String} licenceNumber
 * @param {Array} transactions
 * @return {InvoiceLicence}
 */
const getOrCreateInvoiceLicence = (invoice, licenceNumber, transactions) => {
  let invoiceLicence = invoice.getInvoiceLicenceByLicenceNumber(licenceNumber);
  if (!invoiceLicence) {
    invoiceLicence = mappers.invoiceLicence.dbToModel(transactions[0].billingInvoiceLicence);
    invoice.invoiceLicences.push(invoiceLicence);
  }
  return invoiceLicence;
};

/**
 * Decorates the supplied invoice licence with an array of Transaction instances
 * created using the supplied transactions data.
 * Each transaction is converted to a credit
 * @param {InvoiceLicence} invoiceLicence
 * @param {Array} transactions
 */
const decorateInvoiceLicenceWithCredits = (invoiceLicence, transactions) => {
  const newTransactions = transactions.map(
    row => mappers.transaction.dbToModel(row).toCredit()
  );
  invoiceLicence.transactions.push(...newTransactions);
  return invoiceLicence;
};

/**
 * Decorates the supplied batch with invoices, invoice licences and transactions.
 * If the invoice or invoice licences are missing in the batch, they are created.
 * All the supplied transactions are converted to credits
 * @param {Batch} batch
 * @param {Array} transactions
 */
const decorateBatchWithCreditTransactions = async (batch, transactions) => {
  // Load invoice account data from CRM
  const invoiceAccountIds = getUniqueInvoiceAccountIds(transactions);
  const invoiceAccounts = await crmV2Connector.invoiceAccounts.getInvoiceAccountsByIds(invoiceAccountIds);

  // Group transactions by invoice/invoice licence
  const groups = groupBy(transactions, transaction => {
    const financialYearEnding = getFinancialYear(transaction.startDate);
    return `${transaction.billingInvoiceLicence.billingInvoice.invoiceAccountNumber}_${financialYearEnding}_${transaction.billingInvoiceLicence.licenceRef}`;
  });

  for (const key in groups) {
    const [invoiceAccountNumber, financialYearEnding, licenceNumber] = key.split('_');
    const invoice = getOrCreateInvoice(batch, invoiceAccountNumber, financialYearEnding, invoiceAccounts);
    const invoiceLicence = getOrCreateInvoiceLicence(invoice, licenceNumber, transactions);
    decorateInvoiceLicenceWithCredits(invoiceLicence, transactions);
  }

  return batch;
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

  // Add credits to current batch
  await decorateBatchWithCreditTransactions(batch, transactions);

  // Persist batch
  return batchService.saveInvoicesToDB(batch);
};

const isDeMinimis = transaction => transaction.isDeMinimis;

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
    historical: indexByTransactionKey(historicalTransactions),
    historicalDeMinimis: indexByTransactionKey(historicalTransactions.filter(isDeMinimis))
  };

  // Create a list of delete/credit actions required
  const actions = getSupplementaryActions(indexes);

  await Promise.all([
    newRepos.billingTransactions.delete(actions.delete),
    addCreditsToBatch(batchId, actions.credit)
  ]);
};

exports.processBatch = processBatch;
