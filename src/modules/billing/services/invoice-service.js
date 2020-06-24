'use strict';

const { find, flatMap, partialRight, isEmpty } = require('lodash');
const pWaterfall = require('p-waterfall');

// Connectors
const invoiceAccountsConnector = require('../../../lib/connectors/crm-v2/invoice-accounts');
const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');

const repos = require('../../../lib/connectors/repos');

const mappers = require('../mappers');
const { logger } = require('../../../logger');

// Models
const Batch = require('../../../lib/models/batch');

// Errors
const { NotFoundError } = require('../../../lib/errors');

const isBatchReadyOrSent = batch =>
  batch.statusIsOneOf(Batch.BATCH_STATUS.ready, Batch.BATCH_STATUS.sent);

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
 * Loads CRM invoice account data into context
 * @param {Object} context
 * @return {Promise<Object>} updated context
 */
const getCRMData = async context => {
  const ids = context.billingInvoices.map(row => row.invoiceAccountId);
  if (ids.length > 0) {
    context.crmInvoiceAccounts = await invoiceAccountsConnector.getInvoiceAccountsByIds(ids);
  }
  return context;
};

/**
 * Loads single customer bill run data from charge module into context object
 * @param {Object} context
 * @return {Promise<Object>} updated context
 */
const getChargeModuleCustomer = async context => {
  const { batch, invoiceId } = context;
  if (isBatchReadyOrSent(batch)) {
    const billingInvoice = find(context.billingInvoices, { billingInvoiceId: invoiceId });
    const { billRun } = await chargeModuleBillRunConnector.getCustomer(batch.externalId, billingInvoice.invoiceAccountNumber);
    context.cmBillRun = billRun;
  }
  return context;
};

/**
 * Loads bill run data from charge module into context object
 * @param {Object} context
 * @return {Promise<Object>} updated context
 */
const getChargeModuleBillRun = async context => {
  const { batch } = context;
  try {
    // Load Charge Module summary data
    const { billRun } = await chargeModuleBillRunConnector.get(batch.externalId);
    context.cmBillRun = billRun;
  } catch (err) {
    logger.error('CM error', err);
  }
  return context;
};

/**
 * Loads all invoices for batch into context object
 * @param {Object} context
 * @return {Promise<Object>} updated context
 */
const getBatchInvoices = async context => {
  const { batch, includeTransactions } = context;
  const method = includeTransactions ? 'findOneWithInvoicesWithTransactions' : 'findOneWithInvoices';
  const { billingInvoices } = await repos.billingBatches[method](batch.id);
  context.billingInvoices = billingInvoices;
  return context;
};

/**
 * Loads an individual billing invoice into the context object
 * @param {Object} context
 * @return {Promise<Object>} updated context
 */
const getInvoice = async context => {
  const { batch, invoiceId } = context;

  const data = await repos.billingInvoices.findOne(invoiceId);

  if (!data) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`);
  }
  if (data.billingBatch.billingBatchId !== batch.id) {
    throw new NotFoundError(`Invoice ${invoiceId} not found in batch ${batch.id}`);
  }

  context.billingInvoices = [data];
  return context;
};

/**
 * Decorates an Invoice instance with charge data found in context
 * @param {Invoice} invoice
 * @param {Object} context
 * @return {Invoice}
 */
const decorateInvoiceWithCMData = (invoice, context) => {
  const { cmBillRun } = context;
  const { accountNumber } = invoice.invoiceAccount;

  if (cmBillRun && accountNumber && !isEmpty(cmBillRun.customers)) {
    // Map transaction values from CM to Transaction models
    const map = indexChargeModuleTransactions(cmBillRun, accountNumber);
    getInvoiceTransactions(invoice).forEach(transaction => {
      transaction.value = map.get(transaction.externalId);
    });

    // Add invoice totals
    invoice.totals = mappers.totals.chargeModuleBillRunToInvoiceModel(cmBillRun, accountNumber);
  }
};

/**
 * Decorates Invoice model with CRM invoice account data found in context
 * @param {Invoice} invoice
 * @param {Object} context
 */
const decorateInvoiceWithCRMData = (invoice, context) => {
  const crmInvoiceAccount = find(context.crmInvoiceAccounts, { invoiceAccountId: invoice.invoiceAccount.id });
  const tempInvoice = mappers.invoice.crmToModel(crmInvoiceAccount);
  return invoice.pickFrom(tempInvoice, ['invoiceAccount', 'address', 'agentCompany', 'contact']);
};

/**
 * Maps a row of data from water.billing_invoices to an Invoice service model
 * @param {Object} billingInvoice
 * @param {Object} context
 * @return {Invoice}
 */
const mapInvoice = (billingInvoice, context) => {
  const invoice = mappers.invoice.dbToModel(billingInvoice);
  decorateInvoiceWithCRMData(invoice, context);
  decorateInvoiceWithCMData(invoice, context);
  return invoice;
};

const mapToInvoices = context => {
  return context.billingInvoices.map(billingInvoice => mapInvoice(billingInvoice, context));
};

/**
 * Loads a single invoice by ID in the specified batch
 * @param {Batch} batch
 * @param {String} invoiceId
 * @return {Promise<Invoice>}
 */
const getInvoiceForBatch = async (batch, invoiceId) => {
  const context = { batch, invoiceId };

  const res = await pWaterfall([
    getInvoice,
    getChargeModuleCustomer,
    getCRMData,
    mapToInvoices
  ], context);

  return res[0];
};

/**
 * Loads all invoices in batch
 * @param {Batch} batch
 * @param {Boolean} [includeTransactions] - whether to include transactions data
 * @return {Promise<Invoice>}
 */
const getInvoicesForBatch = async (batch, includeTransactions = false) => {
  const context = { batch, includeTransactions };

  return pWaterfall([
    getBatchInvoices,
    getChargeModuleBillRun,
    getCRMData,
    mapToInvoices
  ], context);
};

const getInvoicesTransactionsForBatch = partialRight(getInvoicesForBatch, true);

exports.getInvoicesForBatch = getInvoicesForBatch;
exports.getInvoiceForBatch = getInvoiceForBatch;
exports.getInvoicesTransactionsForBatch = getInvoicesTransactionsForBatch;
exports.saveInvoiceToDB = saveInvoiceToDB;
