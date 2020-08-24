'use strict';

/**
 * @module functions to decorate service models with Charge Module bill run data
 */
const Batch = require('../../../lib/models/batch');
const Invoice = require('../../../lib/models/invoice');
const validators = require('../../../lib/models/validators');

const mappers = require('../mappers');

const { uniq } = require('lodash');

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
 * @param {Object} transaction service transaction
 * @param {Transaction} transactionMap CM transaction
 */
const decorateTransaction = (transaction, cmTransaction) => {
  const serviceTransaction = transaction;
  return serviceTransaction.fromHash({
    value: cmTransaction.chargeValue,
    isDeMinimis: cmTransaction.deminimis,
    isMinimumCharge: cmTransaction.minimumChargeAdjustment
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

  const transactionsByLicence = indexTransactionsByLicenceNumber(customerFinYearSummary.transactions);
  // Decorate each invoice transaction and add missing transactions created in the CM
  invoice.invoiceLicences.map(invoiceLicence => {
    transactionsByLicence.get(invoiceLicence.licence.licenceNumber).map(cmTransaction => {
      const serviceTransaction = invoiceLicence.transactions.find(trans => trans.externalId === cmTransaction.id);
      if (serviceTransaction) {
        return decorateTransaction(serviceTransaction, cmTransaction);
      }
      return invoiceLicence.transactions.push(mappers.transaction.cmToModel(cmTransaction));
    });
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
  batch.totals = mappers.totals.chargeModuleBillRunToBatchModel(cmResponse.billRun.summary);

  // Decorate each invoice
  batch.invoices.map(invoice => decorateInvoice(invoice, cmResponse));

  return batch;
};

exports.decorateInvoice = decorateInvoice;
exports.decorateBatch = decorateBatch;
