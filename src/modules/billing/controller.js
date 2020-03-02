'use strict';

const Boom = require('@hapi/boom');

const config = require('../../../config');
const repos = require('../../lib/connectors/repository');
const Event = require('../../lib/models/event');

const { envelope } = require('../../lib/response');
const populateBatchChargeVersionsJob = require('./jobs/populate-batch-charge-versions');
const { jobStatus } = require('./lib/batch');
const invoiceService = require('./services/invoice-service');
const batchService = require('./services/batch-service');
const eventService = require('../../lib/services/events');

const mappers = require('./mappers');

const createBatchEvent = (userEmail, batch) => {
  const batchEvent = new Event();
  batchEvent.type = 'billing-batch';
  batchEvent.subtype = batch.batch_type;
  batchEvent.issuer = userEmail;
  batchEvent.metadata = { batch };
  batchEvent.status = jobStatus.start;

  return eventService.create(batchEvent);
};

const createBatch = (regionId, batchType, financialYearEnding, season) => {
  const fromFinancialYearEnding = batchType === 'supplementary'
    ? financialYearEnding - config.billing.supplementaryYears
    : financialYearEnding;

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
    const data = {
      message: `Batch already live for region ${regionId}`,
      existingBatch: await batchService.getMostRecentLiveBatchByRegion(regionId)
    };
    return h.response(data).code(409);
  }

  // add these details to the event log
  const batchEvent = await createBatchEvent(userEmail, batch);

  // add a new job to the queue so that the batch can be filled
  // with charge versions
  const message = populateBatchChargeVersionsJob.createMessage(batchEvent.eventId, batch);
  await request.messageQueue.publish(message);

  return h.response(envelope({
    event: batchEvent,
    url: `/water/1.0/event/${batchEvent.eventId}`
  })).code(202);
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
  const { batchId } = request.params;
  const invoices = await invoiceService.getInvoicesForBatch(batchId);
  return invoices.map(mappers.api.invoice.modelToBatchInvoices);
};

const getBatchInvoicesDetails = async request => {
  const { batchId } = request.params;
  const data = await invoiceService.getInvoicesTransactionsForBatch(batchId);
  return data;
};

const getBatchInvoiceDetail = async request => {
  const { batchId, invoiceId } = request.params;
  const invoice = await invoiceService.getInvoiceForBatch(batchId, invoiceId);
  return invoice || Boom.notFound(`No invoice found with id: ${invoiceId} in batch with id: ${batchId}`);
};

const deleteAccountFromBatch = async request => {
  const { batchId, accountId } = request.params;

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

const deleteBatch = async (request, h) => {
  const { batch } = request.pre;
  const { internalCallingUser } = request.defra;

  try {
    await batchService.deleteBatch(batch, internalCallingUser);
    return h.response().code(204);
  } catch (err) {
    return err;
  }
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

exports.getBatch = getBatch;
exports.getBatches = getBatches;
exports.getBatchInvoices = getBatchInvoices;
exports.getBatchInvoiceDetail = getBatchInvoiceDetail;
exports.getBatchInvoicesDetails = getBatchInvoicesDetails;

exports.deleteAccountFromBatch = deleteAccountFromBatch;
exports.deleteBatch = deleteBatch;

exports.postApproveBatch = postApproveBatch;
exports.postCreateBatch = postCreateBatch;
