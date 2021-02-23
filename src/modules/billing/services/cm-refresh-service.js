'use strict';

/**
 * @module syncs the charge module invoices/licences/transactions
 * to the local WRLS DB
 */
const { get, difference } = require('lodash');
const errors = require('../../../lib/errors');

const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');
const { logger } = require('../../../logger');

// Mappers
const transactionMapper = require('../mappers/transaction');

// Services
const invoiceService = require('./invoice-service');
const batchService = require('./batch-service');
const transactionService = require('./transactions-service');

/**
 * Calls CM transactions endpoint multiple times and
 * collates all paginated results for a given invoice
 *
 * @param {String} cmBillRunId
 * @param {String} customerReference
 * @param {Number} financialYearEnding
 * @return {Array<Object>} CM transaction details
 */
const getAllCmTransactionsForInvoice = async (cmBillRunId, customerReference, financialYearEnding) => {
  try {
    const { data, pagination: { pageCount } } = await chargeModuleBillRunConnector.getInvoiceTransactions(cmBillRunId, customerReference, financialYearEnding - 1, 1);

    const result = data.transactions;

    for (let page = 2; page <= pageCount; page++) {
      const { data: { transactions } } = await chargeModuleBillRunConnector.getInvoiceTransactions(cmBillRunId, customerReference, financialYearEnding - 1, page);
      result.push(...transactions);
    }
    return result;
  } catch (error) {
    logger.error(`Unable to retrieve transactions for CM invoice ${cmBillRunId} ${customerReference} ${financialYearEnding}`);
    throw error;
  }
};

const getInvoiceKey = (invoiceAccountNumber, financialYearEnding) =>
  `${invoiceAccountNumber}_${financialYearEnding}`;

/**
 * Get invoices mapped by account number / financial year
 * @param {Batch} batch
 * @return {Map}
 */
const getInvoiceMap = invoices => {
  return invoices.reduce((acc, invoice) => {
    const key = getInvoiceKey(invoice.invoiceAccount.accountNumber, invoice.financialYear.endYear);
    return acc.set(key, invoice);
  }, new Map());
};

/**
 * Gets a map of customer/financial year summaries
 * keyed by customerRef_financialYearEnding
 *
 * @param {Object} cmResponse - full CM batch summary data
 * @return {Map}
 */
const getCMInvoiceMap = cmResponse => {
  return cmResponse.billRun.customers.reduce((acc, customer) => {
    const { customerReference } = customer;
    customer.summaryByFinancialYear.forEach(summary => {
      const key = getInvoiceKey(customerReference, summary.financialYear + 1);
      acc.set(key, {
        ...summary,
        customerReference
      });
    });
    return acc;
  }, new Map());
};

/**
 * Indexes transactions in an invoice by external ID
 * @param {Invoice} invoice
 * @return {Map}
 */
const getTransactionMap = invoice => {
  return invoice.invoiceLicences.reduce((map, invoiceLicence) => {
    invoiceLicence.transactions.forEach(transaction => {
      map.set(transaction.externalId, transaction);
    });
    return map;
  }, new Map());
};

const mapTransaction = (invoice, transactionMap, cmTransaction) => {
  // Update existing transaction
  if (transactionMap.has(cmTransaction.id)) {
    return transactionMap
      .get(cmTransaction.id)
      .fromHash({
        isDeMinimis: cmTransaction.deminimis,
        value: cmTransaction.chargeValue
      });
  } else {
    // Create a new min charge model and add to heirarchy
    const newTransaction = transactionMapper.cmToModel(cmTransaction);
    invoice
      .getInvoiceLicenceByLicenceNumber(cmTransaction.licenceNumber)
      .transactions
      .push(newTransaction);
    return newTransaction;
  }
};

const getCMTransactionId = cmTransaction => cmTransaction.id;

/**
 * Deletes transactions no longer in the invoice according to the CM data
 * @param {Array<Object>} cmTransactions
 * @param {Map} transactionMap - keyed by external (CM) id
 * @return {Promise}
 */
const deleteTransactions = (cmTransactions, transactionMap) => {
  const validIds = cmTransactions.map(getCMTransactionId);
  const deleteExternalIds = difference(Array.from(transactionMap.keys()), validIds);
  const deleteIds = deleteExternalIds.map(
    externalId => transactionMap.get(externalId).id
  );
  return transactionService.deleteById(deleteIds);
};

/**
 * Maps CM data to an Invoice model
 *
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @param {Object} cmInvoiceSummary - CM data for this customer/financial year
 * @param {Array<Object>} cmTransactions - transactions for this customer/financial year
 * @return {Invoice}
 */
const updateInvoice = async (batch, invoice, cmInvoiceSummary, cmTransactions) => {
  // Populate invoice model with updated CM data
  invoice.fromHash({
    isDeMinimis: cmInvoiceSummary.deminimis,
    invoiceNumber: cmTransactions[0].transactionReference,
    netTotal: cmInvoiceSummary.netTotal,
    invoiceValue: cmInvoiceSummary.debitLineValue,
    creditNoteValue: cmInvoiceSummary.creditLineValue
  });

  // Persist
  await invoiceService.saveInvoiceToDB(batch, invoice);

  // Index WRLS transactions by external ID
  const transactionMap = getTransactionMap(invoice);

  // Create/update transactions
  for (const cmTransaction of cmTransactions) {
    const invoiceLicence = invoice
      .getInvoiceLicenceByLicenceNumber(cmTransaction.licenceNumber);
    const transaction = mapTransaction(invoice, transactionMap, cmTransaction);
    await transactionService.saveTransactionToDB(invoiceLicence, transaction);
  }

  // Delete transactions no longer on the CM side
  await deleteTransactions(cmTransactions, transactionMap);

  return invoice;
};

const updateInvoices = async (batch, cmResponse) => {
  // Fetch WRLS batch invoices
  const invoices = await invoiceService.getInvoicesForBatch(batch, { includeTransactions: true });

  // Map invoices in CM summary response
  const cmInvoiceMap = getCMInvoiceMap(cmResponse);

  // Get existing invoices in DB and map
  const invoiceMap = await getInvoiceMap(invoices);

  for (const [key, cmInvoiceSummary] of cmInvoiceMap.entries()) {
    // Get the CM transactions for this customer/financial year
    const cmTransactions = await getAllCmTransactionsForInvoice(
      batch.externalId,
      cmInvoiceSummary.customerReference,
      cmInvoiceSummary.financialYear + 1
    );

    // Note: for now we don't need to expect invoices not in our DB
    // this will likely change when the CM implements rebilling
    updateInvoice(batch, invoiceMap.get(key), cmInvoiceSummary, cmTransactions);
  }
};

const isCMGeneratingSummary = cmResponse => get(cmResponse, 'billRun.status') === 'generating_summary';

const updateBatch = async batchId => {
  // Fetch WRLS batch
  let batch = await batchService.getBatchById(batchId);
  if (!batch) {
    throw new errors.NotFoundError(`CM refresh failed, batch ${batchId} not found`);
  }

  // Get CM bill run summary
  const cmResponse = await chargeModuleBillRunConnector.get(batch.externalId);
  if (isCMGeneratingSummary(cmResponse)) {
    return false;
  }

  // Set batch totals
  batch = await batchService.updateWithCMSummary(batch.id, cmResponse);

  // Update invoices in batch
  await updateInvoices(batch, cmResponse);
  return true;
};

exports.updateBatch = updateBatch;
