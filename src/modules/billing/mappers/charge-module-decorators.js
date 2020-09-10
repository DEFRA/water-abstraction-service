'use strict';

/**
 * @module functions to decorate service models with Charge Module bill run data
 */
const Batch = require('../../../lib/models/batch');
const Invoice = require('../../../lib/models/invoice');
const validators = require('../../../lib/models/validators');
const { TransactionStatusError } = require('../lib/errors');

const mappers = require('../mappers');

const { isEmpty, uniq } = require('lodash');

const isBatchReadyOrSent = batch =>
  batch.statusIsOneOf(Batch.BATCH_STATUS.ready, Batch.BATCH_STATUS.sent);

const findCustomer = (cmResponse, customerReference) =>
  cmResponse.billRun.customers.find(customer => customer.customerReference === customerReference);

const findCustomerFinancialYearSummary = (cmResponse, customerReference, financialYearEnding) =>
  findCustomer(cmResponse, customerReference).summaryByFinancialYear.find(summary => summary.financialYear === financialYearEnding - 1);

/**
 * Returns a map of transactions indexed by the licence number
 * @param {Array<Object>} transactions
 * @return {Map}
 */
const indexTransactionsByLicenceNumber = transactions => {
  const licenceNumbers = uniq(transactions.map(trans => trans.licenceNumber));
  return licenceNumbers.reduce(
    (map, licenceNumber) =>
      map.set(licenceNumber, transactions.filter(trans => trans.licenceNumber === licenceNumber)),
    new Map()
  );
};

/**
 * Decorates transactions with data from the charge module response
 * @param {Transaction} serviceTransaction to be decorated
 * @param {Object} cmTransaction
 */
const decorateTransaction = (serviceTransaction, cmTransaction) =>
  serviceTransaction.fromHash({
    value: cmTransaction.chargeValue,
    isDeMinimis: cmTransaction.deminimis,
    isMinimumCharge: cmTransaction.minimumChargeAdjustment
  });

/**
 * Maps all CM transaction data to the invoice licence
 * @param {InvoiceLicence} invoiceLicence containing service transactions
 * @param {Array} cmTransactions for that given licence
 */
const decorateTransactions = (invoiceLicence, cmTransactions) => {
  if (isEmpty(invoiceLicence.transactions)) return invoiceLicence;

  cmTransactions.map(cmTransaction => {
    const serviceTransaction = invoiceLicence.transactions.find(trans => trans.externalId === cmTransaction.id);
    if (serviceTransaction) {
      return decorateTransaction(serviceTransaction, cmTransaction);
    }
    if (!cmTransaction.minimumChargeAdjustment) {
      throw new TransactionStatusError(`Unexpected Charge Module transaction externalId: ${cmTransaction.id}`);
    }
    // charge period needs to be provided separately - it is the same for all transactions within an invoice licence
    return invoiceLicence.transactions.push(mappers.transaction.cmToModel(cmTransaction, invoiceLicence.transactions[0].chargePeriod));
  });
};

/**
 * Decorates invoice with data from the charge module response
 * @param {Batch} batch
 * @param {Object} cmResponse
 * @return {Batch}
 */
const decorateInvoice = (invoice, cmResponse) => {
  validators.assertIsInstanceOf(invoice, Invoice);
  validators.assertObject(cmResponse);

  // Set invoice totals
  invoice.totals = mappers.totals.chargeModuleBillRunToInvoiceModel(cmResponse, invoice.invoiceAccount.accountNumber, invoice.financialYear.yearEnding);

  // Set de-minimis flag
  const customerFinYearSummary = findCustomerFinancialYearSummary(cmResponse, invoice.invoiceAccount.accountNumber, invoice.financialYear.endYear);
  invoice.isDeMinimis = customerFinYearSummary.deminimis;

  const cmTransactionsByLicence = indexTransactionsByLicenceNumber(customerFinYearSummary.transactions);

  // Decorate each invoiceLicence transaction
  // and add any minimum charge transactions from CM
  for (const [licenceNumber, transactions] of cmTransactionsByLicence) {
    const invoiceLicence = invoice.getInvoiceLicenceByLicenceNumber(licenceNumber);
    decorateTransactions(invoiceLicence, transactions);
  }

  return invoice;
};

/**
 * Decorates batch with data from the charge module response
 * @param {Batch} batch
 * @param {Object} cmResponse
 * @return {Batch}
 */
const decorateBatch = (batch, cmResponse) => {
  validators.assertIsInstanceOf(batch, Batch);
  validators.assertObject(cmResponse);

  // Don't do any mapping unless batch is ready/sent
  if (!isBatchReadyOrSent(batch)) {
    return batch;
  }

  // Set batch totals
  batch.totals = mappers.totals.chargeModuleBillRunToBatchModel(cmResponse.billRun.summary);

  // Decorate each invoice
  batch.invoices.map(invoice => decorateInvoice(invoice, cmResponse));

  return batch;
};

exports.decorateInvoice = decorateInvoice;
exports.decorateBatch = decorateBatch;
