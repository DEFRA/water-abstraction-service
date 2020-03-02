'use strict';

const { find, flatMap, get } = require('lodash');
const repos = require('../../../lib/connectors/repos');

const mappers = require('../mappers');

// Connectors
const chargeModuleBatchConnector = require('../../../lib/connectors/charge-module/batches');

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
 * @param {String} batchId UUID of the batch to find invoices for
 * @param {String} invoiceId UUID of the invoice
 * @return {Promise<Invoice>}
 */
const getInvoiceForBatch = async (batchId, invoiceId) => {
  // Get object graph of invoice and related data
  const data = await repos.billingInvoices.findOne(invoiceId);
  if (!data || data.billingBatch.billingBatchId !== batchId) {
    return null;
  }
  // Map to Invoice service model
  const invoice = mappers.invoice.dbToModel(data);

  // Get CRM company and Charge Module summary data
  const accountNumber = get(data, 'invoice.invoiceAccount.accountNumber');
  const regionId = get(data, 'billingBatch.region.chargeRegionId');
  const [, chargeModuleSummary] = await Promise.all([
    decorateInvoicesWithCompanies([invoice]),
    chargeModuleBatchConnector.send(regionId, batchId, true, accountNumber)
  ]);

  // Use Charge Module data to populate totals and transaction values
  invoice.totals = mappers.totals.chargeModuleBillRunToBatchModel(chargeModuleSummary.summary);
  decorateInvoiceTransactionValues(invoice, chargeModuleSummary);

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
 * Given an Invoice model and the data from a charge module bill run call,
 * decorates the invoice model with a ChargeModuleSummary model
 * @param {Invoice} invoice
 * @param {Object} chargeModuleBillRun
 * @return {Invoice} - the decorated invoice
 */
const decorateInvoiceWithTotals = (invoice, chargeModuleBillRun) => {
  const { accountNumber } = invoice.invoiceAccount;
  invoice.totals = mappers.totals.chargeModuleBillRunToInvoiceModel(chargeModuleBillRun, accountNumber);
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
 * Sets the transaction values on an invoice
 * @param {Invoice} invoice
 * @param {Object} chargeModuleBillRun
 */
const decorateInvoiceTransactionValues = (invoice, chargeModuleBillRun) => {
  const { accountNumber } = invoice.invoiceAccount;

  const map = indexChargeModuleTransactions(chargeModuleBillRun, accountNumber);

  getInvoiceTransactions(invoice).forEach(transaction => {
    transaction.value = map.get(transaction.externalId);
  });
};

/**
 * Converts a row of invoice row data from water.billing_invoices to Invoice models
 * And decorates with charge module summaries and company data from CRM
 * @param {Array} rows - array of invoice data loaded from water.billing_invoices
 * @param {Object} chargeModuleSummary - response from charge module bill run API call
 * @return {Promise<Array>} array of Invoice instances
 */
const getInvoicesForBatch = async batchId => {
  // Load Batch instance from repo with invoices
  const data = await repos.billingBatches.findOneWithInvoices(batchId);

  // Load Charge Module summary data
  const chargeModuleSummary = await chargeModuleBatchConnector.send(data.region.chargeRegionId, batchId, true);

  // Map data to Invoice models
  const invoices = data.billingInvoices.map(mappers.invoice.dbToModel);

  // Decorate with Charge Module summary data and CRM company data
  invoices.forEach(invoice => decorateInvoiceWithTotals(invoice, chargeModuleSummary));
  await decorateInvoicesWithCompanies(invoices);
  return invoices;
};

const getInvoicesTransactionsForBatch = async batchId => {
  const data = await repos.billingBatches.findOneWithInvoicesWithTransactions(batchId);
  const chargeModuleSummary = await chargeModuleBatchConnector.send(data.region.chargeRegionId, batchId, true);
  const invoices = [];
  data.billingInvoices.forEach(invoice => {
    const invoiceModel = mappers.invoice.dbToModel(invoice);
    decorateInvoiceTransactionValues(invoiceModel, chargeModuleSummary);
    invoices.push(invoiceModel);
  });
  return decorateInvoicesWithCompanies(invoices);
};

exports.getInvoicesForBatch = getInvoicesForBatch;
exports.getInvoicesTransactionsForBatch = getInvoicesTransactionsForBatch;
exports.getInvoiceForBatch = getInvoiceForBatch;
exports.saveInvoiceToDB = saveInvoiceToDB;
