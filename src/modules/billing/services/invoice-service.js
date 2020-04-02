'use strict';

const { find, flatMap, get } = require('lodash');
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
  // Map to Invoice service model
  const invoice = mappers.invoice.dbToModel(data);

  // Get CRM company and Charge Module summary data
  const accountNumber = get(invoice, 'invoiceAccount.accountNumber');
  const [, { billRun }] = await Promise.all([
    decorateInvoicesWithCompanies([invoice]),
    chargeModuleBillRunConnector.getCustomer(batch.externalId, accountNumber)
  ]);

  console.log(billRun);

  // Use Charge Module data to populate totals and transaction values
  invoice.totals = mappers.totals.chargeModuleBillRunToInvoiceModel(billRun, accountNumber);
  decorateInvoiceTransactionValues(invoice, billRun);

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
const getInvoicesForBatch = async batch => {
  // Load Batch instance from repo with invoices
  const data = await repos.billingBatches.findOneWithInvoices(batch.id);

  // Map data to Invoice models
  const invoices = data.billingInvoices.map(mappers.invoice.dbToModel);

  try {
    // Load Charge Module summary data
    const { billRun } = await chargeModuleBillRunConnector.get(batch.externalId);

    // Decorate with Charge Module summary data and CRM company data
    invoices.forEach(invoice => decorateInvoiceWithTotals(invoice, billRun));
  } catch (err) {
    logger.info('CM error', err);
  }

  await decorateInvoicesWithCompanies(invoices);
  return invoices;
};

const getInvoicesTransactionsForBatch = async batch => {
  // Load Batch instance from repo with invoices
  const data = await repos.billingBatches.findOneWithInvoicesWithTransactions(batch.id);

  // Map data to Invoice models
  const invoices = data.billingInvoices.map(mappers.invoice.dbToModel);
  try {
    // Load Charge Module summary data
    const { billRun } = await chargeModuleBillRunConnector.get(batch.externalId);

    // const chargeModuleSummary = await chargeModuleBatchConnector.send(data.region.chargeRegionId, batchId, true);
    invoices.forEach(invoice => decorateInvoiceTransactionValues(invoice, billRun));
  } catch (err) {
    logger.info('CM error', err);
  }

  // Add CRM company data
  await decorateInvoicesWithCompanies(invoices);
  return invoices;
};

exports.getInvoicesForBatch = getInvoicesForBatch;
exports.getInvoiceForBatch = getInvoiceForBatch;
exports.getInvoicesTransactionsForBatch = getInvoicesTransactionsForBatch;
exports.saveInvoiceToDB = saveInvoiceToDB;
