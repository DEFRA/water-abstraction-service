'use strict';

/**
 * @module functions to decorate service models with Charge Module bill run data
 */
const Batch = require('../../../lib/models/batch');
const Invoice = require('../../../lib/models/invoice');
const validators = require('../../../lib/models/validators');
const { TransactionStatusError, InvoiceNumberError } = require('../lib/errors');
const { getFinancialYear } = require('@envage/water-abstraction-helpers').charging;

const mappers = require('../mappers');

const { isEmpty, uniq, groupBy, find, merge, identity } = require('lodash');

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

const getKey = transaction => `${transaction.customerReference}_${getCmFinancialYearForTransaction(transaction)}`;

const groupTransactionsByCustomerAndFinancialYear = cmTransactions => groupBy(cmTransactions, getKey);

const mergeTransactionData = (customerSummary, transactionsForFinYear) => {
  // minimum charge transactions don't have a year associated with them, so customer summary is undefined
  // they are still included in the customer summary for the financial year, so aren't lost
  if (!customerSummary) {
    return null;
  }
  return customerSummary.transactions.forEach(summaryTransaction =>
    merge(summaryTransaction, find(transactionsForFinYear, { id: summaryTransaction.id }))
  );
};
const getSummaryByKey = (customers, key) => {
  const [customerRef, finYear] = key.split('_');
  const customer = customers.find(c => c.customerReference === customerRef);
  return customer.summaryByFinancialYear.find(summary => summary.financialYear === parseInt(finYear));
};

const mapCmTransactionsToCustomers = (customers, groupedTransactions) => {
  Object.keys(groupedTransactions).forEach(key => {
    const customerSummary = getSummaryByKey(customers, key);
    return mergeTransactionData(customerSummary, groupedTransactions[key]);
  });

  return customers;
};

const mapCmTransactionsToSummary = (cmResponse, cmTransactions) => {
  if (isEmpty(cmTransactions)) {
    return cmResponse.billRun.customers;
  }

  const transactionsByCustomerAndFinYear = groupTransactionsByCustomerAndFinancialYear(cmTransactions);
  return mapCmTransactionsToCustomers(cmResponse.billRun.customers, transactionsByCustomerAndFinYear);
};

/**
 * Find invoice number, or return null if none present
 */
const findInvoiceNumber = (customerFinYearSummary, invoiceAccountNumber) => {
  const invoiceNumbers = uniq(customerFinYearSummary.transactions.map(trans => trans.transactionReference)).filter(identity);
  if (invoiceNumbers.length > 1) {
    const { financialYear } = customerFinYearSummary;
    throw new InvoiceNumberError(`Invoice account ${invoiceAccountNumber} has multiple invoice numbers for financial year: ${financialYear}`);
  }
  return invoiceNumbers[0] || null;
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
  if (isEmpty(invoiceLicence.transactions)) {
    return;
  }
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
  invoice.invoiceNumber = findInvoiceNumber(customerFinYearSummary, invoice.invoiceAccount.accountNumber);

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
 * @param {Object} cmTransactions
 * @return {Batch}
 */
const decorateBatch = (batch, cmResponse, cmTransactions = []) => {
  validators.assertIsInstanceOf(batch, Batch);
  validators.assertObject(cmResponse);
  validators.assertArray(cmTransactions);

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
exports.mapCmTransactionsToSummary = mapCmTransactionsToSummary;
