'use strict';

/**
 * @module functions to decorate service models with Charge Module bill run data
 */
const Batch = require('../../../lib/models/batch');
const Invoice = require('../../../lib/models/invoice');
const validators = require('../../../lib/models/validators');
const { TransactionStatusError } = require('../lib/errors');
const chargeModuleTransactionConnector = require('../../../lib/connectors/charge-module/transactions');

const mappers = require('../mappers');

const { isEmpty, uniq } = require('lodash');

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

const decorateMinimumChargeTransaction = async cmTransaction => {
  const { transaction } = await chargeModuleTransactionConnector.get(cmTransaction.id);
  return mappers.transaction.cmToModel(transaction);
};

/**
 * Maps all CM transaction data to the invoice licence
 * @param {InvoiceLicence} invoiceLicence containing service transactions
 * @param {Array} cmTransactions for that given licence
 */
const decorateTransactions = async (invoiceLicence, cmTransactions) => {
  if (isEmpty(invoiceLicence.transactions)) return invoiceLicence;
  for (const cmTransaction of cmTransactions) {
    const serviceTransaction = invoiceLicence.transactions.find(trans => trans.externalId === cmTransaction.id);
    if (serviceTransaction) {
      decorateTransaction(serviceTransaction, cmTransaction);
    } else if (!cmTransaction.minimumChargeAdjustment) {
      // the only transactions which do not exist in the service should be minimum charge
      throw new TransactionStatusError(`Unexpected Charge Module transaction externalId: ${cmTransaction.id}`);
    } else {
      const minChargeTransaction = await decorateMinimumChargeTransaction(cmTransaction);
      invoiceLicence.transactions.push(minChargeTransaction);
    }
  };
};

/**
 * Decorates invoice with data from the charge module response
 * @param {Batch} batch
 * @param {Object} cmResponse
 * @return {Batch}
 */
const decorateInvoice = async (invoice, cmResponse) => {
  validators.assertIsInstanceOf(invoice, Invoice);
  validators.assertObject(cmResponse);
  // Set invoice totals
  // Note: the customer/financial year summary is not guaranteed to be present in the CM
  // because creation of transactions for this customer/financial year could have failed to create in the CM
  const totals = mappers.totals.chargeModuleBillRunToInvoiceModel(cmResponse, invoice.invoiceAccount.accountNumber, invoice.financialYear.yearEnding);
  if (!totals) {
    return invoice;
  }
  invoice.totals = totals;

  mappers.totals.chargeModuleBillRunToInvoiceModel(cmResponse, invoice.invoiceAccount.accountNumber, invoice.financialYear.yearEnding);

  // Set de-minimis flag
  const customerFinYearSummary = findCustomerFinancialYearSummary(cmResponse, invoice.invoiceAccount.accountNumber, invoice.financialYear.endYear);
  invoice.isDeMinimis = customerFinYearSummary.deminimis;

  const cmTransactionsByLicence = indexTransactionsByLicenceNumber(customerFinYearSummary.transactions);

  // Decorate each invoiceLicence transaction
  // and add any minimum charge transactions from CM
  for (const [licenceNumber, transactions] of cmTransactionsByLicence) {
    const invoiceLicence = invoice.getInvoiceLicenceByLicenceNumber(licenceNumber);
    await decorateTransactions(invoiceLicence, transactions);
  }

  return invoice;
};

/**
 * Decorates batch with data from the charge module response
 * @param {Batch} batch
 * @param {Object} cmResponse
 * @return {Batch}
 */
const decorateBatch = async (batch, cmResponse) => {
  validators.assertIsInstanceOf(batch, Batch);
  validators.assertObject(cmResponse);

  // Set batch totals
  batch.totals = mappers.totals.chargeModuleBillRunToBatchModel(cmResponse.billRun.summary);

  // Decorate each invoice
  for (const invoice of batch.invoices) {
    await decorateInvoice(invoice, cmResponse);
  }

  return batch;
};

exports.decorateInvoice = decorateInvoice;
exports.decorateBatch = decorateBatch;
