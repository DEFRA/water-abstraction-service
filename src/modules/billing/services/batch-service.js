const newRepos = require('../../../lib/connectors/repos');
const mappers = require('../mappers');
const repos = require('../../../lib/connectors/repository');

const chargeModuleBatchConnector = require('../../../lib/connectors/charge-module/batches');
const Batch = require('../../../lib/models/batch');

const invoiceService = require('./invoice-service');
const invoiceLicenceService = require('./invoice-licences-service');
const transactionsService = require('./transactions-service');

/**
 * Loads a Batch instance by ID
 * @param {String} id - batch ID GUID
 * @return {Promise<Batch>}
 */
const getBatchById = async id => {
  const row = await newRepos.billingBatches.findOne(id);
  return mappers.batch.dbToModel(row);
};

const getBatches = async (page = 1, perPage = Number.MAX_SAFE_INTEGER) => {
  const result = await newRepos.billingBatches.findPage(page, perPage);
  return {
    data: result.data.map(mappers.batch.dbToModel),
    pagination: result.pagination
  };
};

const deleteBatch = async batchId => {
  // TODO: This function is a stub and will eventually
  // have a defined signature and response behaviour.
  // If this fails, the batch should not be deleted from
  // the WRLS database tables.
  await chargeModuleBatchConnector.deleteBatch();

  await repos.billingBatchChargeVersionYears.deleteByBatchId(batchId);
  await repos.billingBatchChargeVersions.deleteByBatchId(batchId);
  await repos.billingTransactions.deleteByBatchId(batchId);
  await repos.billingInvoiceLicences.deleteByBatchId(batchId);
  await repos.billingInvoices.deleteByBatchId(batchId);
  await repos.billingBatches.deleteByBatchId(batchId);
};

/**
 * Sets the specified batch to 'error' status
 * @param {String} batchId
 * @return {Promise}
 */
const setErrorStatus = batchId =>
  newRepos.billingBatches.update(batchId, Batch.statuses.error);

const saveInvoiceLicenceTransactions = async invoiceLicence => {
  for (const transaction of invoiceLicence.transactions) {
    const { billingTransactionId } = await transactionsService.saveTransactionToDB(invoiceLicence, transaction);
    transaction.id = billingTransactionId;
  }
};

const saveInvoiceLicences = async invoice => {
  for (const invoiceLicence of invoice.invoiceLicences) {
    const { billingInvoiceLicenceId } = await invoiceLicenceService.saveInvoiceLicenceToDB(invoice, invoiceLicence);
    invoiceLicence.id = billingInvoiceLicenceId;
    await saveInvoiceLicenceTransactions(invoiceLicence);
  }
};

const saveInvoicesToDB = async batch => {
  for (const invoice of batch.invoices) {
    const { billingInvoiceId } = await invoiceService.saveInvoiceToDB(batch, invoice);
    invoice.id = billingInvoiceId;
    await saveInvoiceLicences(invoice);
  }
};

exports.getBatchById = getBatchById;
exports.getBatches = getBatches;
exports.deleteBatch = deleteBatch;
exports.setErrorStatus = setErrorStatus;
exports.saveInvoicesToDB = saveInvoicesToDB;
