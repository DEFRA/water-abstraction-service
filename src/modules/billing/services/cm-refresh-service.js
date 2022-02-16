'use strict';

/**
 * @module syncs the charge module invoices/licences/transactions
 * to the local WRLS DB
 */
const { get, difference, isNull } = require('lodash');
const Bluebird = require('bluebird');
const errors = require('../../../lib/errors');

const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');
const { logger } = require('../../../logger');

// Models
const Transaction = require('../../../lib/models/transaction');

// Mappers
const invoiceMapper = require('../../../lib/mappers/invoice');
const transactionMapper = require('../mappers/transaction');

// Services
const invoiceService = require('../../../lib/services/invoice-service');
const batchService = require('./batch-service');
const transactionService = require('./transactions-service');

/**
 * Calls CM transactions endpoint multiple times and
 * collates all paginated results for a given invoice
 *
 * @param {String} cmBillRunId
 * @param {String} invoiceId
 * @return {Array<Object>} CM transaction details
 */
const getAllCmTransactionsForInvoice = async (cmBillRunId, invoiceId) => {
  try {
    const { invoice } = await chargeModuleBillRunConnector.getInvoiceTransactions(cmBillRunId, invoiceId);
    return invoice.licences.map(lic => lic.transactions.map(transaction => {
      return {
        ...transactionMapper.inverseCreditNoteSign(transaction),
        transactionReference: invoice.transactionReference,
        isDeminimis: invoice.deminimisInvoice,
        licenceNumber: lic.licenceNumber
      };
    })).flat();
  } catch (error) {
    logger.error(`Unable to retrieve transactions for CM invoice. Bill run ID ${cmBillRunId} and invoice ID ${invoiceId}`);
    throw error;
  }
};

/**
 * Creates a Map from the supplied array of items, using the supplied
 * mapper to get the map key
 *
 * @param {Array<Object>} items
 * @param {Function} keyMapper
 * @returns {Map}
 */
const createMap = (items, keyMapper) => items.reduce(
  (map, item) => map.set(keyMapper(item), item),
  new Map()
);

const getCustomerFinancialYearKey = (invoiceAccountNumber, financialYearEnding) =>
  `${invoiceAccountNumber}_${financialYearEnding}`;

/**
 * Gets a key for mapping charge module invoices.
 * This is the id for rebilling, or the customer/financial year otherwise
 *
 * @param {Object} cmInvoice
 * @returns {String}
 */
const getCMInvoiceKey = cmInvoice => cmInvoice.rebilledType === 'O'
  ? getCustomerFinancialYearKey(cmInvoice.customerReference, cmInvoice.financialYear + 1)
  : cmInvoice.id;

/**
 * Gets a key for mapping WRLS invoices.
 * This is the external (CM) id for rebilling, or the customer/financial year otherwise
 *
 * @param {Object} invoice
 * @returns {String}
 */
const getWRLSInvoiceKey = invoice => isNull(invoice.rebillingState)
  ? getCustomerFinancialYearKey(invoice.invoiceAccount.accountNumber, invoice.financialYear.endYear)
  : invoice.externalId;

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

const mapTransaction = (transactionMap, cmTransaction) => {
  const transaction = transactionMap.has(cmTransaction.id)
    ? transactionMap.get(cmTransaction.id)
    : new Transaction();

  return transaction.fromHash(transactionMapper.cmToPojo(cmTransaction));
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
 * Updates the transactions within a particular invoice within a batch
 * using the data from the CM
 *
 * @param {Invoice} invoice
 * @param {Array<Object>} cmTransactions
 * @returns {Promise}
 */
const updateTransactions = async (invoice, cmTransactions) => {
  // Index WRLS transactions by external ID
  const transactionMap = getTransactionMap(invoice);

  // Create/update transactions
  for (const cmTransaction of cmTransactions) {
    const invoiceLicence = invoice.getInvoiceLicenceByLicenceNumber(cmTransaction.licenceNumber);
    const transaction = mapTransaction(transactionMap, cmTransaction);

    await transactionService.saveTransactionToDB(invoiceLicence, transaction);
  }

  // Delete transactions no longer on the CM side
  return deleteTransactions(cmTransactions, transactionMap);
};

/**
 * Maps CM data to the Invoice model and saves it,
 * then updates all transactions within the invoice
 *
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @param {Object} cmInvoiceSummary - CM data for this customer/financial year
 * @return {Invoice}
 */
const updateInvoice = async (batch, invoice, cmInvoiceSummary) => {
  const cmTransactions = await getAllCmTransactionsForInvoice(
    batch.externalId,
    cmInvoiceSummary.id
  );

  // Populate invoice model with updated CM data
  invoice.fromHash(
    invoiceMapper.cmToPojo(cmInvoiceSummary, cmTransactions)
  );

  // Persist invoice and transactions to DB
  await invoiceService.updateInvoiceModel(invoice);
  await updateTransactions(invoice, cmTransactions);

  return invoice;
};

/**
 * Updates all the invoices within a batch
 *
 * @param {Batch} batch
 * @param {Object} cmResponse
 * @return {Promise}
 */
const updateInvoices = async (batch, cmResponse) => {
  // Fetch WRLS batch invoices
  const invoices = await invoiceService.getInvoicesForBatch(batch, { includeTransactions: true });

  // Map WRLS invoices and CM invoices by the same keys
  const invoiceMaps = {
    wrls: createMap(invoices, getWRLSInvoiceKey),
    cm: createMap(cmResponse.billRun.invoices, getCMInvoiceKey)
  };

  // Iterate through invoices in series, to avoid overwhelming CM with too many simultaneous requests
  return Bluebird.mapSeries(invoiceMaps.cm, async ([key, cmInvoice]) => {
    const inv = invoiceMaps.wrls.get(key);
    inv && updateInvoice(batch, inv, cmInvoice);
  }
  );
};

const isCMGeneratingSummary = cmResponse => ['generating', 'pending', 'deleting', 'sending'].includes(get(cmResponse, 'billRun.status'));
/**
 * Updates the batch with the given batch ID
 * with data retrieved from the CM
 *
 * @param {String} batchId
 */
const updateBatch = async batchId => {
  // Fetch WRLS batch
  const batch = await batchService.getBatchById(batchId);
  if (!batch) {
    throw new errors.NotFoundError(`CM refresh failed, batch ${batchId} not found`);
  }

  // Get CM bill run summary
  const cmResponse = await chargeModuleBillRunConnector.get(batch.externalId);

  if (isCMGeneratingSummary(cmResponse)) {
    return false;
  }

  // Update invoices in batch
  // It is important to update the invoices first so that
  // for a batch containing only re-billing, there are >0 transactions
  // in the batch before calculating the new batch status
  await updateInvoices(batch, cmResponse);

  await batchService.updateWithCMSummary(batch.id, cmResponse);

  return true;
};

exports.updateBatch = updateBatch;
