'use strict';

/**
 * @module functions to decorate service models with Charge Module bill run data
 */
const Batch = require('../../../lib/models/batch');
const Invoice = require('../../../lib/models/invoice');
const validators = require('../../../lib/models/validators');

const totalsMapper = require('../mappers/totals');

const isBatchReadyOrSent = batch =>
  batch.statusIsOneOf(Batch.BATCH_STATUS.ready, Batch.BATCH_STATUS.sent);

const findCustomer = (cmResponse, customerReference) =>
  cmResponse.billRun.customers.find(customer => customer.customerReference === customerReference);

const findCustomerFinancialYearSummary = (cmResponse, customerReference, financialYearEnding) =>
  findCustomer(cmResponse, customerReference).summaryByFinancialYear.find(summary => summary.financialYear === financialYearEnding - 1);

/**
 * Returns a map of transactions indexed by the Charge Module transaction ID
 * @param {Array<Object>} transactions
 * @return {Map}
 */
const indexChargeModuleTransactions = transactions => transactions.reduce(
  (map, transaction) => map.set(transaction.id, transaction),
  new Map()
);

const decorateTransaction = (transaction, transactionMap) => {
  const cmTransaction = transactionMap.get(transaction.externalId);
  return transaction.fromHash({
    value: cmTransaction.chargeValue,
    isDeMinimis: cmTransaction.deminimis
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
  invoice.totals = totalsMapper.chargeModuleBillRunToInvoiceModel(cmResponse, invoice.invoiceAccount.accountNumber, invoice.financialYear.yearEnding);

  // Set de-minimis flag
  const customerFinYearSummary = findCustomerFinancialYearSummary(cmResponse, invoice.invoiceAccount.accountNumber, invoice.financialYear.endYear);
  invoice.isDeMinimis = customerFinYearSummary.deminimis;

  // Decorate each invoice transaction
  const transactionMap = indexChargeModuleTransactions(customerFinYearSummary.transactions);
  invoice.invoiceLicences.map(invoiceLicence => {
    invoiceLicence.transactions.map(transaction => decorateTransaction(transaction, transactionMap));
  });

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
  batch.totals = totalsMapper.chargeModuleBillRunToBatchModel(cmResponse.billRun.summary);

  // Decorate each invoice
  batch.invoices.map(invoice => decorateInvoice(invoice, cmResponse));

  return batch;
};

exports.decorateInvoice = decorateInvoice;
exports.decorateBatch = decorateBatch;
