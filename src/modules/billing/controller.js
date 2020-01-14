'use strict';

const Boom = require('@hapi/boom');

const repos = require('../../lib/connectors/repository');
const event = require('../../lib/event');
const { envelope, errorEnvelope } = require('../../lib/response');
const populateBatchChargeVersionsJob = require('./jobs/populate-batch-charge-versions');
const { jobStatus } = require('./lib/batch');
const invoiceService = require('./services/invoice-service');
const batchService = require('./services/batch-service');

const createBatchEvent = async (userEmail, batch) => {
  const batchEvent = event.create({
    type: 'billing-batch',
    subtype: batch.batch_type,
    issuer: userEmail,
    metadata: { batch },
    status: jobStatus.start
  });

  const response = await event.save(batchEvent);
  return response.rows[0];
};

const createBatch = (regionId, batchType, financialYearEnding, season) => {
  const fromFinancialYearEnding = batchType === 'supplementary' ? financialYearEnding - 6 : financialYearEnding;

  return repos.billingBatches.createBatch(
    regionId,
    batchType,
    fromFinancialYearEnding,
    financialYearEnding,
    season
  );
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
  const { userEmail, regionId, batchType, financialYearEnding, season } = request.payload;

  // create a new entry in the batch table
  const batch = await createBatch(regionId, batchType, financialYearEnding, season);

  if (!batch) {
    const data = errorEnvelope(`Batch already processing for region ${regionId}`);
    return h.response(data).code(409);
  }

  // add these details to the event log
  const batchEvent = await createBatchEvent(userEmail, batch);

  // add a new job to the queue so that the batch can be filled
  // with charge versions
  const message = populateBatchChargeVersionsJob.createMessage(batchEvent.event_id);
  await request.messageQueue.publish(message);

  return h.response(envelope({
    event: batchEvent,
    url: `/water/1.0/event/${batchEvent.event_id}`
  })).code(202);
};

const getBatch = async request => {
  const { batchId } = request.params;
  const batch = await repos.billingBatches.getById(batchId);

  return batch
    ? envelope(batch, true)
    : Boom.notFound(`No batch found with id: ${batchId}`);
};

const getBatches = async request => {
  const { page, perPage } = request.query;
  const batches = await batchService.getBatches(page, perPage);
  return batches;
};

const getBatchInvoices = async request => {
  const { batchId } = request.params;
  const invoices = await invoiceService.getInvoicesForBatch(batchId);

  return envelope(invoices, true);
};

const getBatchInvoiceDetail = async request => {
  const { batchId, invoiceId } = request.params;
  const invoice = await invoiceService.getInvoiceForBatch(batchId, invoiceId);

  return invoice
    ? envelope(invoice, true)
    : Boom.notFound(`No invoice found with id: ${invoiceId} in batch with id: ${batchId}`);
};

const deleteAccountFromBatch = async request => {
  const { batchId, accountId } = request.params;
  const batch = await repos.billingBatches.getById(batchId);

  if (!batch) {
    return Boom.notFound(`No batch found with id: ${batchId}`);
  }

  if (batch.status !== 'review') {
    return Boom.forbidden(`Cannot delete account from batch (${batchId}) when status is ${batch.status}`);
  }

  const invoices = await invoiceService.getInvoicesForBatch(batchId);

  const invoicesForAccount = invoices.filter(invoice => invoice.invoiceAccount.id === accountId);

  if (invoicesForAccount.length === 0) {
    return Boom.notFound(`No invoices for account (${accountId}) in batch (${batchId})`);
  }

  /*
    TODO: Temporary implementation

    Currently only removes the transactions from the local
    water.billing_transactions table.

    This needs to also remove the transactions at the charge module,
    but we are currently waiting on the decision whether this will happen
    in bulk or one transaction at a time.

    After this is resolved the following connector code can be extracted
    out to a service layer function where charge module interaction will
    also take place.

    The code below this comment is not included in the unit tests.
  */
  const { rowCount } = await repos.billingTransactions.deleteByInvoiceAccount(batchId, accountId);
  return {
    transactionsDeleted: rowCount
  };
};

exports.postCreateBatch = postCreateBatch;
exports.getBatch = getBatch;
exports.getBatches = getBatches;
exports.getBatchInvoices = getBatchInvoices;
exports.getBatchInvoiceDetail = getBatchInvoiceDetail;
exports.deleteAccountFromBatch = deleteAccountFromBatch;
