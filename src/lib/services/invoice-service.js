'use strict';

const { find, partialRight, pickBy } = require('lodash');
const pWaterfall = require('p-waterfall');

const { logger } = require('../../logger');

// Connectors
const invoiceAccountsConnector = require('../connectors/crm-v2/invoice-accounts');
const repos = require('../connectors/repos');
const chargeModuleBillRunApi = require('../../lib/connectors/charge-module/bill-runs');

const mappers = require('../../modules/billing/mappers');
const FinancialYear = require('../models/financial-year');

// Errors
const { NotFoundError } = require('../errors');

const getInvoiceById = async invoiceId => {
  const data = await repos.billingInvoices.findOne(invoiceId);
  if (!data) {
    throw new NotFoundError(`Invoice ${invoiceId} not found`);
  }
  return data;
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
 * Loads CRM invoice account data into context
 * @param {Object} context
 * @return {Promise<Object>} updated context
 */
const getCRMData = async context => {
  const { billingInvoices, options: { includeInvoiceAccounts } } = context;

  if (!includeInvoiceAccounts) {
    return context;
  }

  const ids = billingInvoices.map(row => row.invoiceAccountId);
  if (ids.length > 0) {
    context.crmInvoiceAccounts = await invoiceAccountsConnector.getInvoiceAccountsByIds(ids);
  }
  return context;
};

/**
 * Loads all invoices for batch into context object
 * @param {Object} context
 * @return {Promise<Object>} updated context
 */
const getBatchInvoices = async context => {
  const { batch, options: { includeTransactions } } = context;
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

  const data = await getInvoiceById(invoiceId);

  if (data.billingBatchId !== batch.id) {
    throw new NotFoundError(`Invoice ${invoiceId} not found in batch ${batch.id}`);
  }

  context.billingInvoices = [data];
  return context;
};

/**
 * Decorates Invoice model with CRM invoice account data found in context
 * @param {Invoice} invoice
 * @param {Object} context
 */
const decorateInvoiceWithCRMData = (invoice, context) => {
  const crmInvoiceAccount = find(context.crmInvoiceAccounts, { invoiceAccountId: invoice.invoiceAccount.id });

  const properties = mappers.invoice.crmToModel(crmInvoiceAccount).pick(
    'address',
    'invoiceAccount',
    'agentCompany',
    'contact'
  );

  return invoice.fromHash(pickBy(properties));
};

/**
 * Maps a row of data from water.billing_invoices to an Invoice service model
 * @param {Object} billingInvoice
 * @param {Object} context
 * @return {Invoice}
 */
const mapInvoice = async (billingInvoice, context) => {
  const { options: { includeInvoiceAccounts } } = context;
  const invoice = mappers.invoice.dbToModel(billingInvoice);
  return includeInvoiceAccounts ? decorateInvoiceWithCRMData(invoice, context) : invoice;
};

const mapToInvoices = async context => {
  const invoices = [];
  for (const billingInvoice of context.billingInvoices) {
    const mappedInvoice = await mapInvoice(billingInvoice, context);
    invoices.push(mappedInvoice);
  }
  return invoices;
};

/**
 * Loads a single invoice by ID in the specified batch
 * @param {Batch} batch
 * @param {String} invoiceId
 * @return {Promise<Invoice>}
 */
const getInvoiceForBatch = async (batch, invoiceId) => {
  const context = { batch, invoiceId, options: { includeTransactions: true, includeInvoiceAccounts: true } };

  const res = await pWaterfall([
    getInvoice,
    getCRMData,
    mapToInvoices
  ], context);

  return res[0];
};

/**
 * Loads all invoices in batch
 * @param {Batch} batch
 * @param {Object} options
 * @param {Boolean} options.includeTransactions
 * @param {Boolean} options.includeInvoiceAccounts - whether to load invoice data from CRM
 * @return {Promise<Invoice>}
 */
const getInvoicesForBatch = async (batch, options = {}) => {
  const defaults = {
    includeTransactions: false,
    includeInvoiceAccounts: false
  };

  const context = { batch, options: Object.assign(defaults, options) };

  return pWaterfall([
    getBatchInvoices,
    getCRMData,
    mapToInvoices
  ], context);
};

const getInvoicesTransactionsForBatch = partialRight(getInvoicesForBatch, {
  includeTransactions: true
});

/**
 * Gets or creates an invoice in the batch
 * If the invoice needs creating, the customer details are fetched from the CRM v2 API
 *
 * @param {String} batchId
 * @param {String} invoiceAccountId
 * @param {Number} financialYearEnding
 * @return {Promise<Object>} the new/existing invoice service model
 */
const getOrCreateInvoice = async (batchId, invoiceAccountId, financialYearEnding) => {
  const existingRow = await repos.billingInvoices.findOneBy({
    billingBatchId: batchId,
    invoiceAccountId,
    financialYearEnding
  });
  if (existingRow) {
    return mappers.invoice.dbToModel(existingRow);
  }
  // Look up invoice account in CRM and map to service model
  const [crmData] = await invoiceAccountsConnector.getInvoiceAccountsByIds([invoiceAccountId]);
  const modelFromCrm = mappers.invoice.crmToModel(crmData);
  modelFromCrm.financialYear = new FinancialYear(financialYearEnding);

  // Write to DB and map back to service model
  const newRow = await saveInvoiceToDB({ id: batchId }, modelFromCrm);
  return mappers.invoice.dbToModel(newRow);
};

const getInvoicesForInvoiceAccount = async (invoiceAccountId, page, perPage) => {
  const { data, pagination } = await repos.billingInvoices.findAllForInvoiceAccount(invoiceAccountId, page, perPage);
  return { data: data.map(mappers.invoice.dbToModel), pagination };
};

const updateInvoice = async (invoiceAccountId, changes) => {
  const invoice = await repos.billingInvoices.update(invoiceAccountId, changes);
  return mappers.invoice.dbToModel(invoice);
};

const getInvoicesFlaggedForRebilling = async regionId => {
  const data = await repos.billingInvoices.findByIsFlaggedForRebillingAndRegion(regionId);
  return data.map(mappers.invoice.dbToModel);
};

/**
 * Rebills the requested invoice
 *
 * @param {Batch} batch
 * @param {Invoice} Invoice
 * @return {Promise}
 */
const rebillInvoice = async (batch, invoice) => {
  try {
    await chargeModuleBillRunApi.rebillInvoice(batch.externalId, invoice.externalId);
  } catch (err) {
    if (err.statusCode === 409) {
      logger.info(`Invoice ${invoice.id} already marked for rebilling in batch ${batch.id}`);
    } else {
      logger.error(`Failed to mark invoice ${invoice.id} for rebilling in charge module`);
      throw err;
    }
  }
  // Set the "originalBillingInvoiceId" to this invoice ID.  This allows an invoice
  // to be linked with the reversal and recharge invoices which will be created by the CM
  const updatedRow = await repos.billingInvoices.update(invoice.id, {
    originalBillingInvoiceId: invoice.id,
    rebillingState: null
  });
  return mappers.invoice.dbToModel(updatedRow);
};

/**
 * Resets invoices originally flagged for rebilling which have now been re-billed
 * in the current batch
 *
 * @param {String} batchId - current batch ID
 * @returns {Promise}
 */
const resetIsFlaggedForRebilling = batchId => repos.billingInvoices.resetIsFlaggedForRebilling(batchId);

exports.getInvoicesForBatch = getInvoicesForBatch;
exports.getInvoiceForBatch = getInvoiceForBatch;
exports.getInvoicesTransactionsForBatch = getInvoicesTransactionsForBatch;
exports.saveInvoiceToDB = saveInvoiceToDB;
exports.getOrCreateInvoice = getOrCreateInvoice;
exports.getInvoicesForInvoiceAccount = getInvoicesForInvoiceAccount;
exports.getInvoiceById = getInvoiceById;
exports.updateInvoice = updateInvoice;
exports.getInvoicesFlaggedForRebilling = getInvoicesFlaggedForRebilling;
exports.rebillInvoice = rebillInvoice;
exports.resetIsFlaggedForRebilling = resetIsFlaggedForRebilling;
