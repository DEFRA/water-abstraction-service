'use strict';

const { groupBy, omit } = require('lodash');

// Models
const Transaction = require('../../../../lib/models/transaction');

// Services
const billingTransactionsRepo = require('../../../../lib/connectors/repos/billing-transactions');
const invoiceService = require('../invoice-service');
const invoiceLicencesService = require('../invoice-licences-service');

const { actions } = require('./constants');

/**
 * These are the keys present on a transaction object
 * from the initial DB query and subsequent processing
 * which must be omitted before attempting to write the
 * transaction to the DB
 */
const omitKeys = [
  'licenceId',
  'financialYearEnding',
  'invoiceAccountNumber',
  'billingTransactionId',
  'isCurrentBatch',
  'billingBatchId',
  'isSummer'
];

const getReversedTransaction = (invoiceLicence, sourceTransaction) => ({
  ...omit(sourceTransaction, omitKeys),
  billingInvoiceLicenceId: invoiceLicence.id,
  sourceTransactionId: sourceTransaction.billingTransactionId,
  status: Transaction.statuses.candidate,
  legacyId: null,
  externalId: null,
  isCredit: !sourceTransaction.isCredit
});

/**
 * Gets a list of transactions in the current batch plus historical transactions
 * for the licences in the supplementary batch
 *
 * @param {String} batchId
 * @return {Promise<Array>}
 */
const getTransactions = async batchId => {
  const [batchTransactions, historicalTransactions] = await Promise.all([
    billingTransactionsRepo.findByBatchId(batchId),
    billingTransactionsRepo.findHistoryByBatchId(batchId)
  ]);
  return [...batchTransactions, historicalTransactions];
};

/**
 * Gets transaction ID from transaction
 *
 * @param {Object} transaction
 * @return {String}
 */
const getTransactionId = transaction => transaction.billingTransactionId;

const isMarkedForDeletion = transaction => transaction.action === actions.deleteTransaction;

const isMarkedForReversal = transaction => transaction.action === actions.reverseTransaction;

const getInvoiceKey = transaction =>
  `${transaction.financialYearEnding}_${transaction.invoiceAccountId}`;

const getLicenceId = transaction => transaction.licenceId;

const reverseInvoiceLicenceTransactions = async (invoiceLicence, transactions) => {
  for (const transaction of transactions) {
    const data = getReversedTransaction(invoiceLicence, transaction);
    await billingTransactionsRepo.create(data);
  }
};

const reverseTransactions = async (batchId, transactions) => {
  const reverseTransactions = transactions.filter(isMarkedForReversal);

  // Group by invoice
  const invoiceGroups = groupBy(reverseTransactions, getInvoiceKey);

  for (const invoiceKey in invoiceGroups) {
    const [financialYearEnding, invoiceAccountId] = invoiceKey.split('_');

    // Get/create invoice in current batch
    const invoice = await invoiceService.getOrCreateInvoice(
      batchId, invoiceAccountId, financialYearEnding
    );

    // Group transactions by licence
    const licenceGroups = groupBy(invoiceGroups[invoiceKey], getLicenceId);

    // For each licence in the group
    for (const licenceId of licenceGroups) {
      const invoiceLicenceTransactions = licenceGroups[licenceId];

      // Get/create invoice licence in current batch
      const [{ licenceRef }] = invoiceLicenceTransactions;
      const invoiceLicence = await invoiceLicencesService.getOrCreateInvoiceLicence(
        invoice.id, licenceId, licenceRef
      );

      // Create reversed transations in the invoice licence
      await reverseInvoiceLicenceTransactions(invoiceLicence, invoiceLicenceTransactions);
    }
  }
};

const deleteTransactions = transactions => {
  // Find transaction IDs flagged for deletion
  const ids = transactions
    .filter(isMarkedForDeletion)
    .map(getTransactionId);

  // Delete if >0 records to delete
  if (ids.length === 0) {
    return;
  }

  return billingTransactionsRepo.delete(ids);
};

const persistChanges = async (batchId, transactions) => {
  await deleteTransactions(transactions);
  await reverseTransactions(batchId, transactions);
};

exports.getTransactions = getTransactions;
exports.persistChanges = persistChanges;
