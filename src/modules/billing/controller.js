'use strict';

const Boom = require('@hapi/boom');

const { envelope } = require('../../lib/response');
const createBillRunJob = require('./jobs/create-bill-run');
const refreshTotalsJob = require('./jobs/refresh-totals');
const { jobStatus } = require('./lib/event');
const invoiceService = require('./services/invoice-service');
const invoiceLicenceService = require('./services/invoice-licences-service');
const batchService = require('./services/batch-service');
const { createBatchEvent } = require('./lib/batch-event');

const controller = require('../../lib/controller');
const mapErrorResponse = require('../../lib/map-error-response');
const mappers = require('./mappers');

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
      issuer: userEmail,
      batch,
      subtype: batch.type,
      status: jobStatus.start
    });

    // add a new job to the queue so that the batch can be created in the CM
    const message = createBillRunJob.createMessage(batchEvent.id, batch);
    await request.messageQueue.publish(message);

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
const getBatch = async request => {
  const { totals } = request.query;
  return totals ? batchService.decorateBatchWithTotals(request.pre.batch) : request.pre.batch;
};

const getBatches = async request => {
  const { page, perPage } = request.query;
  const batches = await batchService.getBatches(page, perPage);
  return batches;
};

const getBatchInvoices = async request => {
  const { batch } = request.pre;
  try {
    const invoices = await invoiceService.getInvoicesForBatch(batch, true);
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
  try {
    // Delete the invoice
    await batchService.deleteBatchInvoice(batch, invoiceId);

    // Refresh batch net total / counts
    await request.messageQueue.publish(refreshTotalsJob.createMessage(batch.id));

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

const postApproveBatch = async (request, h) => {
  const { batch } = request.pre;
  const { internalCallingUser } = request.defra;

  try {
    const approvedBatch = await batchService.approveBatch(batch, internalCallingUser);
    return approvedBatch;
  } catch (err) {
    return err;
  }
};

const getInvoiceLicenceWithTransactions = async (request, h) => {
  const { invoiceLicenceId } = request.params;
  const invoiceLicence = await invoiceLicenceService.getInvoiceLicenceWithTransactions(invoiceLicenceId);
  return invoiceLicence || Boom.notFound(`Invoice licence ${invoiceLicenceId} not found`);
};

/**
 * Deletes an InvoiceLicence by ID
 * @param {String} request.params.invoiceLicenceId
 */
const deleteInvoiceLicence = async (request, h) => {
  const { invoiceLicenceId } = request.params;
  try {
    await invoiceLicenceService.delete(invoiceLicenceId);
    return h.response().code(204);
  } catch (error) {
    return mapErrorResponse(error);
  }
};

exports.getBatch = getBatch;
exports.getBatches = getBatches;
exports.getBatchInvoices = getBatchInvoices;
exports.getBatchInvoiceDetail = getBatchInvoiceDetail;
exports.getBatchInvoicesDetails = getBatchInvoicesDetails;
exports.getInvoiceLicenceWithTransactions = getInvoiceLicenceWithTransactions;
exports.deleteBatchInvoice = deleteBatchInvoice;
exports.deleteBatch = deleteBatch;

exports.postApproveBatch = postApproveBatch;
exports.postCreateBatch = postCreateBatch;

exports.deleteInvoiceLicence = deleteInvoiceLicence;
