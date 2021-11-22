'use strict';

const Boom = require('@hapi/boom');

const { flatMap, uniq } = require('lodash');
const { envelope } = require('../../../lib/response');
const { jobStatus } = require('../lib/event');
const { createBatchEvent } = require('../lib/batch-event');
const controller = require('../../../lib/controller');
const mapErrorResponse = require('../../../lib/map-error-response');
const mappers = require('../mappers');
const { logger } = require('../../../logger');

// Services
const invoiceService = require('../../../lib/services/invoice-service');
const invoiceLicenceService = require('../services/invoice-licences-service');
const chargeVersionService = require('../../../lib/services/charge-versions');
const batchService = require('../services/batch-service');
const importConnector = require('../../../lib/connectors/import');

// Bull job queue manager
const { jobName: createBillRunJobName } = require('../jobs/create-bill-run');
const { jobName: refreshTotalsJobName } = require('../jobs/refresh-totals');
const { jobName: approveBatchJobName } = require('../jobs/approve-batch');
const { BATCH_STATUS } = require('../../../lib/models/batch');
/**
 * Resource that will create a new batch skeleton which will
 * then be asynchronously populated with charge versions by a
 * job that is added to the queue.
 *
 * @param {Object} request HAPI request object
 * @param {Object} h HAPI response toolkit
 */
const postCreateBatch = async (request, h) => {
  const { userEmail, regionId, batchType, financialYearEnding, isSummer } = request.payload;

  try {
    // create a new entry in the batch table
    const batch = await batchService.create(regionId, batchType, financialYearEnding, isSummer);
    // add these details to the event log
    const batchEvent = await createBatchEvent({
      batch,
      issuer: userEmail,
      subtype: batch.type,
      status: jobStatus.start
    });

    // add a new job to the queue so that the batch can be created in the CM
    await request.queueManager.add(createBillRunJobName, batch.id);

    return h.response(envelope({
      batch,
      event: batchEvent,
      url: `/water/1.0/event/${batchEvent.id}`
    })).code(202);
  } catch (err) {
    if (err.existingBatch) {
      return h.response({
        message: err.message,
        existingBatch: err.existingBatch
      }).code(409);
    }
    throw err;
  }
};

/**
 * Get batch with region, and optionally include batch totals
 * @param {Boolean} request.query.totals - indicates that batch totals should be included in response
 * @return {Promise<Batch>}
 */
const getBatch = async request => request.pre.batch;

const getBatches = async request => {
  const { page, perPage } = request.query;
  return batchService.getBatches(page, perPage);
};

const getBatchInvoices = async request => {
  const { batch } = request.pre;
  try {
    const invoices = await invoiceService.getInvoicesForBatch(batch, {
      includeInvoiceAccounts: true
    });
    return invoices.map(mappers.api.invoice.modelToBatchInvoices);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

const getBatchInvoicesDetails = async request => {
  const { batch } = request.pre;
  const data = await invoiceService.getInvoicesTransactionsForBatch(batch);
  return data || Boom.notFound(`No invoices found in batch with id: ${batch.id}`);
};

const getBatchInvoiceDetail = async request => {
  const { invoiceId } = request.params;
  const { batch } = request.pre;
  const invoice = await invoiceService.getInvoiceForBatch(batch, invoiceId);
  return invoice || Boom.notFound(`No invoice found with id: ${invoiceId} in batch with id: ${batch.id}`);
};

/**
 * Delete an invoice by ID from the batch
 * @param {Object} request
 * @param {Batch} request.pre.batch
 * @param {String} request.params.invoiceId
 */
const deleteBatchInvoice = async (request, h) => {
  const { batch } = request.pre;
  const { invoiceId } = request.params;
  const { originalInvoiceId, rebillInvoiceId } = request.query;

  try {
    await batchService.deleteBatchInvoice(batch, invoiceId, originalInvoiceId, rebillInvoiceId); /* delete both related bills */

    // Refresh batch net total / counts
    await request.queueManager.add(refreshTotalsJobName, batch.id);

    return h.response().code(204);
  } catch (err) {
    return mapErrorResponse(err);
  }
};

const deleteBatch = (request, h) => controller.deleteEntity(
  batchService.deleteBatch,
  h,
  request.pre.batch,
  request.defra.internalCallingUser
);

const postApproveBatch = async request => {
  const { batch } = request.pre;
  const { internalCallingUser } = request.defra;
  try {
    await request.queueManager.add(approveBatchJobName, batch.id, internalCallingUser);
    // set the batch status to processing
    return batchService.setStatus(batch.id, BATCH_STATUS.processing);
  } catch (err) {
    return err;
  }
};

const getInvoiceLicenceWithTransactions = async request => {
  const { invoiceLicenceId } = request.params;
  const invoiceLicence = await invoiceLicenceService.getInvoiceLicenceWithTransactions(invoiceLicenceId);
  return invoiceLicence || Boom.notFound(`Invoice licence ${invoiceLicenceId} not found`);
};

const getBatchDownloadData = async request => {
  const { batch } = request.pre;
  const invoices = await invoiceService.getInvoicesForBatch(batch, {
    includeTransactions: true,
    includeInvoiceAccounts: true
  });
  const chargeVersionIds = uniq(flatMap(invoices.map(invoice => {
    return flatMap(invoice.invoiceLicences.map(invoiceLicence =>
      invoiceLicence.transactions
        .filter(transaction => !!transaction.chargeElement)
        .map(transaction => transaction.chargeElement.chargeVersionId)
    ));
  })));
  const chargeVersions = await chargeVersionService.getManyByChargeVersionIds(chargeVersionIds);
  return { invoices, chargeVersions };
};

/**
 * Deletes all billing data (!)
 * - Deletes water.billing_* tables
 * - Deletes water.charge_versions/water.charge_elements
 * - Re-imports charge version data from import module
 * @return {Promise}
 */
const deleteAllBillingData = async (request, h) => {
  try {
    await batchService.deleteAllBillingData();
    await importConnector.postImportChargeVersions();
    return h.response().code(204);
  } catch (err) {
    logger.error('Error deleting all billing data', err);
    return mapErrorResponse(err);
  }
};

const putSetBatchStatusToError = async (request, h) => {
  const { batch } = request.pre;
  try {
    // set the batch status to error
    await batchService.setStatus(batch.id, BATCH_STATUS.error);
    return h.response().code(204);
  } catch (err) {
    return err;
  }
};

exports.getBatch = getBatch;
exports.getBatches = getBatches;
exports.getBatchDownloadData = getBatchDownloadData;
exports.getBatchInvoices = getBatchInvoices;
exports.getBatchInvoiceDetail = getBatchInvoiceDetail;
exports.getBatchInvoicesDetails = getBatchInvoicesDetails;
exports.getInvoiceLicenceWithTransactions = getInvoiceLicenceWithTransactions;
exports.deleteBatchInvoice = deleteBatchInvoice;
exports.deleteBatch = deleteBatch;

exports.postApproveBatch = postApproveBatch;
exports.postCreateBatch = postCreateBatch;

exports.deleteAllBillingData = deleteAllBillingData;
exports.putSetBatchStatusToError = putSetBatchStatusToError;
