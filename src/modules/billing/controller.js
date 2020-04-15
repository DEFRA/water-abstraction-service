'use strict';

const Boom = require('@hapi/boom');

const Event = require('../../lib/models/event');
const Batch = require('../../lib/models/batch');
const BATCH_STATUS = Batch.BATCH_STATUS;

const { envelope } = require('../../lib/response');
const createBillRunJob = require('./jobs/create-bill-run');
const refreshTotalsJob = require('./jobs/refresh-totals');
const { jobStatus } = require('./lib/batch');
const invoiceService = require('./services/invoice-service');
const invoiceLicenceService = require('./services/invoice-licences-service');
const batchService = require('./services/batch-service');
const eventService = require('../../lib/services/events');

const mappers = require('./mappers');

const { NotFoundError } = require('../../lib/errors');
const { BatchStatusError } = require('./lib/errors');

const createBatchEvent = (userEmail, batch) => {
  const batchEvent = new Event();
  batchEvent.type = 'billing-batch';
  batchEvent.subtype = batch.type;
  batchEvent.issuer = userEmail;
  batchEvent.metadata = { batch };
  batchEvent.status = jobStatus.start;

  return eventService.create(batchEvent);
};

/**
 * Resource that will create a new batch skeleton which will
 * then be asyncronously populated with charge versions by a
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
    const batchEvent = await createBatchEvent(userEmail, batch);

    // add a new job to the queue so that the batch can be created in the CM
    const message = createBillRunJob.createMessage(batchEvent.id, batch);
    await request.messageQueue.publish(message);

    return h.response(envelope({
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
  const invoices = await invoiceService.getInvoicesForBatch(batch);
  return invoices.map(mappers.api.invoice.modelToBatchInvoices);
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

const deleteAccountFromBatch = async (request, h) => {
  const { batch } = request.pre;
  const { accountId } = request.params;

  if (!batch.canDeleteAccounts()) {
    return h.response(`Cannot delete account from batch when status is ${batch.status}`).code(422);
  }

  const invoices = await invoiceService.getInvoicesForBatch(batch);
  const invoicesForAccount = invoices.filter(invoice => invoice.invoiceAccount.id === accountId);

  if (invoicesForAccount.length === 0) {
    return Boom.notFound(`No invoices for account (${accountId}) in batch (${batch.id})`);
  }

  const updatedBatch = await batchService.deleteAccountFromBatch(batch, accountId);

  // Refresh batch net total / counts
  await request.messageQueue.publish(refreshTotalsJob.createMessage(batch.id));

  return updatedBatch;
};

const deleteBatch = async (request, h) => {
  const { batch } = request.pre;
  const { internalCallingUser } = request.defra;

  if (!batch.canBeDeleted()) {
    return h.response(`Cannot delete batch when status is ${batch.status}`).code(422);
  }

  await batchService.deleteBatch(batch, internalCallingUser);
  return h.response().code(204);
};

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

const getBatchLicences = async (request, h) => {
  const { batch } = request.pre;

  if (batch.statusIsOneOf(BATCH_STATUS.processing, BATCH_STATUS.error)) {
    return h.response('Cannot get licences for processing or errored batch').code(403);
  }

  if (batch.status === BATCH_STATUS.empty) {
    return [];
  }

  return invoiceLicenceService.getLicencesWithTransactionStatusesForBatch(batch.id);
};

const getInvoiceLicenceWithTransactions = async (request, h) => {
  const { invoiceLicenceId } = request.params;
  const invoiceLicence = await invoiceLicenceService.getInvoiceLicenceWithTransactions(invoiceLicenceId);
  return invoiceLicence || Boom.notFound(`Invoice licence ${invoiceLicenceId} not found`);
};

const mapErrorResponse = error => {
  if (error instanceof NotFoundError) {
    return Boom.notFound(error.message);
  }
  if (error instanceof BatchStatusError) {
    return Boom.forbidden(error.message);
  }
  // Unexpected error
  throw error;
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

const getInvoiceLicenceInvoice = async (request, h) => {
  const { invoiceLicenceId } = request.params;
  try {
    const invoice = await invoiceService.getInvoiceByInvoiceLicenceId(invoiceLicenceId);
    return invoice;
  } catch (error) {
    return mapErrorResponse(error);
  }
};

exports.getBatch = getBatch;
exports.getBatches = getBatches;
exports.getBatchInvoices = getBatchInvoices;
exports.getBatchInvoiceDetail = getBatchInvoiceDetail;
exports.getBatchInvoicesDetails = getBatchInvoicesDetails;
exports.getBatchLicences = getBatchLicences;
exports.getInvoiceLicenceWithTransactions = getInvoiceLicenceWithTransactions;
exports.deleteAccountFromBatch = deleteAccountFromBatch;
exports.deleteBatch = deleteBatch;

exports.postApproveBatch = postApproveBatch;
exports.postCreateBatch = postCreateBatch;

exports.deleteInvoiceLicence = deleteInvoiceLicence;
exports.getInvoiceLicenceInvoice = getInvoiceLicenceInvoice;
