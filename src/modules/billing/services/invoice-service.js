'use strict';

const { find, flatMap, partialRight } = require('lodash');
const repos = require('../../../lib/connectors/repos');

const mappers = require('../mappers');
const { logger } = require('../../../logger');

// Connectors
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');

// Services
const invoiceAccountsService = require('./invoice-accounts-service');

/**
 * Adds the Company object to the InvoiceAccount objects in the Invoice.
 *
 * @param {Array<Invoice>} invoices The invoices to add invoice account companies to
 */
const decorateInvoicesWithCompanies = async invoices => {
  const invoiceAccountIds = invoices.map(invoice => invoice.invoiceAccount.id);
  const invoiceAccounts = await invoiceAccountsService.getByInvoiceAccountIds(invoiceAccountIds);

  return invoices.map(invoice => {
    const invoiceAccount = invoiceAccounts.find(ia => ia.id === invoice.invoiceAccount.id);

    // Replace with CRM invoice account
    if (invoiceAccount) {
      invoice.invoiceAccount = invoiceAccount;
    }

    return invoice;
  });
};

/**
 * Finds an invoice and its licences for the given batch, then
 * overlays the transactions found from the charge-module, and the
 * contacts from the CRM
 *
 * @param {Batch} batch - batch model
 * @param {String} invoiceId UUID of the invoice
 * @return {Promise<Invoice>}
 */
const getInvoiceForBatch = async (batch, invoiceId) => {
  // Get object graph of invoice and related data
  const data = await repos.billingInvoices.findOne(invoiceId);
  if (!data || data.billingBatch.billingBatchId !== batch.id) {
    return null;
  }

  // Get CM data
  const { billRun } = await chargeModuleBillRunConnector.get(batch.externalId, data.invoiceAccountNumber);
  const invoice = mapInvoice(data, billRun);

  // Add licence holder/invoice account data from CRM
  await decorateInvoicesWithCompanies([invoice]);

  return invoice;
};

/**
 * Given a billingInvoice object from the Bookshelf repo,
 * maps to an Invoice service model, optionally with full
 * transaction list.
 * @param {Object} invoiceData
 * @param {Object} billRun - bill run data from CM bill run API
 * @return {Promise<Invoice>}
 */
const mapInvoice = (invoiceData, billRun) => {
  // Create invoice service model
  const invoice = mappers.invoice.dbToModel(invoiceData);

  if (billRun && invoiceData.invoiceAccountNumber) {
    // Map transaction values from CM to Transaction models
    const map = indexChargeModuleTransactions(billRun, invoiceData.invoiceAccountNumber);
    getInvoiceTransactions(invoice).forEach(transaction => {
      transaction.value = map.get(transaction.externalId);
    });

    // Add invoice totals
    invoice.totals = mappers.totals.chargeModuleBillRunToInvoiceModel(billRun, invoiceData.invoiceAccountNumber);
  }

  return invoice;
};

/**
 * Saves an Invoice model to water.billing_invoices
 * @param {Batch} batch
 * @param {Invoice} invoice
 * @return {Promise<Object>} row data inserted (camel case)
 */
const saveInvoiceToDB = async (batch, invoice) => {
  const data = mappers.invoice.modelToDb(batch, invoice);
  return repos.billingInvoices.upsert(data);
};

/**
 * Returns key/value pairs where key is Charge Module transaction ID
 * and value is transaction value
 * @param {Object} chargeModuleBillRun
 * @param {String} customerReference
 */
const indexChargeModuleTransactions = (chargeModuleBillRun, customerReference) => {
  // Find customer in bill run
  const customer = find(chargeModuleBillRun.customers, { customerReference });
  // Generate flat array of transactions for customer
  const transactions = flatMap(customer.summaryByFinancialYear.map(row => row.transactions));

  // Return key/value pairs
  return transactions.reduce(
    (map, row) => map.set(row.id, row.chargeValue),
    new Map()
  );
};

/**
 * Get all transactions in invoice as flat list
 * @param {Invoice} invoice
 * @return {Array<Transaction>}
 */
const getInvoiceTransactions = invoice =>
  flatMap(invoice.invoiceLicences.map(invoiceLicence => invoiceLicence.transactions));

/**
 * Attempts to get CM bill run data - if this fails, the error is caught
 * @param {Batch} batch
 * @return {Object}
 */
const getCMBillRun = async batch => {
  try {
    // Load Charge Module summary data
    const { billRun } = await chargeModuleBillRunConnector.get(batch.externalId);
    return billRun;
  } catch (err) {
    logger.error('CM error', err);
  }
};

const getInvoicesForBatch = async (batch, includeTransactions = false) => {
  const method = includeTransactions ? 'findOneWithInvoicesWithTransactions' : 'findOneWithInvoices';
  const data = await repos.billingBatches[method](batch.id);

  // Get CM bill run data and decorate invoices
  const billRun = await getCMBillRun(batch);
  const invoices = data.billingInvoices.map(billingInvoice => mapInvoice(billingInvoice, billRun));

  // Decorate with CRM data
  await decorateInvoicesWithCompanies(invoices);

  return invoices;
};

const getInvoicesTransactionsForBatch = partialRight(getInvoicesForBatch, true);

exports.getInvoicesForBatch = getInvoicesForBatch;
exports.getInvoiceForBatch = getInvoiceForBatch;
exports.getInvoicesTransactionsForBatch = getInvoicesTransactionsForBatch;
exports.saveInvoiceToDB = saveInvoiceToDB;
