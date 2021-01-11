'use strict';

/**
 * @module functions to decorate service models with Charge Module bill run data
 */
const Batch = require('../../../lib/models/batch');
const Invoice = require('../../../lib/models/invoice');
const validators = require('../../../lib/models/validators');
const { TransactionStatusError } = require('../lib/errors');
const { getFinancialYear } = require('@envage/water-abstraction-helpers').charging;

const mappers = require('../mappers');

const { isEmpty, uniq, groupBy, find, merge, mapValues } = require('lodash');

const findCustomer = (cmResponseCustomers, customerReference) =>
  cmResponseCustomers.find(customer => customer.customerReference === customerReference);

const findCustomerFinancialYearSummary = (cmResponse, invoiceAccountNumber, financialYearEnding) => {
  const customer = findCustomer(cmResponse, invoiceAccountNumber);
  if (!customer) {
    return null;
  }
  const finYear = find(customer.summaryByFinancialYear, { financialYear: financialYearEnding - 1 });
  if (!finYear) {
    return null;
  }
  return finYear;
};

const getCmFinancialYearForTransaction = transaction => getFinancialYear(transaction.periodStart) - 1;

const groupTransactionsByFinancialYear = transactions =>
  groupBy(transactions, getCmFinancialYearForTransaction);

const groupTransactionsByCustomerAndFinancialYear = (cmTransactions) => {
  const groupedByCustomer = groupBy(cmTransactions, 'customerReference');
  return mapValues(groupedByCustomer, groupTransactionsByFinancialYear);
};

const mergeTransactionData = (finYearSummary, transactionsForFinYear) =>
  finYearSummary.transactions.forEach(summaryTransaction =>
    merge(summaryTransaction, find(transactionsForFinYear, { id: summaryTransaction.id }))
  );

const mapCmTransactionsToCustomers = (customers, groupedTransactions) => {
  customers.forEach(customer => customer.summaryByFinancialYear.forEach(summary => {
    const customerTransactions = groupedTransactions[customer.customerReference][summary.financialYear];
    return mergeTransactionData(summary, customerTransactions);
  }));
  return customers;
};

const mapCmTransactionsToSummary = (cmResponse, cmTransactions) => {
  if (isEmpty(cmTransactions)) return cmResponse.billRun.customers;

  const transactionsByCustomerAndFinYear = groupTransactionsByCustomerAndFinancialYear(cmTransactions.data.transactions);
  return mapCmTransactionsToCustomers(cmResponse.billRun.customers, transactionsByCustomerAndFinYear); ;
};

/**
 * Find invoice number, or return null if none present
 */
const findInvoiceNumber = (customerFinYearSummary) => {
  const transactionWithInvoiceNumber = customerFinYearSummary.transactions.find(transaction => !!transaction.transactionReference);
  return transactionWithInvoiceNumber
    ? transactionWithInvoiceNumber.transactionReference
    : null;
};
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
  for (const cmTransaction of cmTransactions) {
    const serviceTransaction = invoiceLicence.transactions.find(trans => trans.externalId === cmTransaction.id);

    // CM transactions should have corresponding transactions in the service,
    // decorate these with data from CM
    if (serviceTransaction) {
      decorateTransaction(serviceTransaction, cmTransaction);

    // minimum charge transactions don't exist in the service,
    // so need to be added to the invoice licence
    } else if (cmTransaction.minimumChargeAdjustment) {
      invoiceLicence.transactions.push(mappers.transaction.cmToModel(cmTransaction));

    // if neither of the above scenarios apply, throw error
    } else {
      throw new TransactionStatusError(`Unexpected Charge Module transaction externalId: ${cmTransaction.id}`);
    }
  };
};

/**
 * Decorates invoice with data from the charge module response
 * @param {Batch} batch
 * @param {Object} cmResponse
 * @return {Batch}
 */
const decorateInvoice = (invoice, cmResponseCustomers) => {
  validators.assertIsInstanceOf(invoice, Invoice);
  validators.assertArray(cmResponseCustomers);
  // Set invoice totals
  // Note: the customer/financial year summary is not guaranteed to be present in the CM
  // because creation of transactions for this customer/financial year could have failed to create in the CM
  const customerFinYearSummary = findCustomerFinancialYearSummary(cmResponseCustomers, invoice.invoiceAccount.accountNumber, invoice.financialYear.endYear);
  if (!customerFinYearSummary) {
    return invoice;
  }
  // Set total related data
  invoice.totals = mappers.totals.chargeModuleBillRunToInvoiceModel(customerFinYearSummary);

  // Set de-minimis flag
  invoice.isDeMinimis = customerFinYearSummary.deminimis;

  // Set invoice number if present
  invoice.invoiceNumber = findInvoiceNumber(customerFinYearSummary);

  const cmTransactionsByLicence = indexTransactionsByLicenceNumber(customerFinYearSummary.transactions);

  // Decorate each invoiceLicence transaction
  // and add any minimum charge transactions from CM
  for (const [licenceNumber, transactions] of cmTransactionsByLicence) {
    const invoiceLicence = invoice.getInvoiceLicenceByLicenceNumber(licenceNumber);
    decorateTransactions(invoiceLicence, transactions);
  }
  console.log({ invoiceTransactions: invoice });
  return invoice;
};

/**
 * Decorates batch with data from the charge module response
 * @param {Batch} batch
 * @param {Object} cmResponse
 * @param {Object} cmTransactions
 * @return {Batch}
 */
const decorateBatch = (batch, cmResponse, cmTransactions = {}) => {
  validators.assertIsInstanceOf(batch, Batch);
  validators.assertObject(cmResponse);
  validators.assertObject(cmTransactions);

  // Set batch totals
  batch.totals = mappers.totals.chargeModuleBillRunToBatchModel(cmResponse.billRun.summary);

  const cmResponseCustomers = mapCmTransactionsToSummary(cmResponse, cmTransactions);

  // Decorate each invoice
  for (const invoice of batch.invoices) {
    decorateInvoice(invoice, cmResponseCustomers);
  }

  return batch;
};

exports.decorateInvoice = decorateInvoice;
exports.decorateBatch = decorateBatch;
