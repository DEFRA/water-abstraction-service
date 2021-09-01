'use strict';

const { groupBy, pick, isNull } = require('lodash');

// Models
const Transaction = require('../../../../lib/models/transaction');

// Services
const billingTransactionsRepo = require('../../../../lib/connectors/repos/billing-transactions');
const invoiceService = require('../../../../lib/services/invoice-service');
const invoiceLicencesService = require('../invoice-licences-service');

const { actions } = require('./constants');

/**
 * These are the keys we wish to pick from the source
 * transaction object when creating a reversed transaction
 * before attempting to write the transaction back to the DB
 */
const pickKeys = [
  'chargeElementId',
  'startDate',
  'endDate',
  'abstractionPeriod',
  'netAmount',
  'authorisedQuantity',
  'billableQuantity',
  'authorisedDays',
  'billableDays',
  'description',
  'source',
  'season',
  'loss',
  'chargeType',
  'volume',
  'section126Factor',
  'section127Agreement',
  'section130Agreement',
  'isTwoPartTariffSupplementary',
  'calculatedVolume',
  'twoPartTariffError',
  'twoPartTariffStatus',
  'twoPartTariffReview',
  'isDeMinimis',
  'isNewLicence'
];

const getReversedTransaction = (invoiceLicence, sourceTransaction) => {
  return {
    ...pick(sourceTransaction, pickKeys),
    billingInvoiceLicenceId: invoiceLicence.id,
    sourceTransactionId: sourceTransaction.billingTransactionId,
    status: Transaction.statuses.candidate,
    legacyId: null,
    externalId: null,
    isCredit: !sourceTransaction.isCredit
  };
};

// this fixes 3044 for when credits were not being created
const isNotRebillingTransaction = transaction => !(['reversal', 'rebilled'].includes(transaction.rebillingState));

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
  const transactions = [...batchTransactions, ...historicalTransactions];
  return transactions.filter(isNotRebillingTransaction);
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
  const validTransactions = transactions.filter(isMarkedForReversal);

  // Group by invoice
  const invoiceGroups = groupBy(validTransactions, getInvoiceKey);

  for (const invoiceKey in invoiceGroups) {
    const [financialYearEnding, invoiceAccountId] = invoiceKey.split('_');

    // Get/create invoice in current batch
    const invoice = await invoiceService.getOrCreateInvoice(
      batchId, invoiceAccountId, parseInt(financialYearEnding)
    );

    // Group transactions by licence
    const licenceGroups = groupBy(invoiceGroups[invoiceKey], getLicenceId);

    // For each licence in the group
    for (const licenceId in licenceGroups) {
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
    return null;
  }

  return billingTransactionsRepo.delete(ids);
};

const persistChanges = async (batchId, transactions) => {
  await deleteTransactions(transactions);
  await reverseTransactions(batchId, transactions);
};

exports.getTransactions = getTransactions;
exports.persistChanges = persistChanges;
