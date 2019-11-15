const Boom = require('@hapi/boom');
const repos = require('../../lib/connectors/repository');
const event = require('../../lib/event');
const populateBillingBatchJob = require('./jobs/populate-billing-batch');
const { envelope } = require('../../lib/response');

const createBatchEvent = async (userEmail, batch) => {
  const batchEvent = event.create({
    type: 'billing-batch',
    subtype: batch.batch_type,
    issuer: userEmail,
    metadata: { batch },
    status: 'received'
  });

  const response = await event.save(batchEvent);
  return response.rows[0];
};

const createBatch = async (regionId, batchType, financialYear, season) => {
  const startFinancialYear = batchType === 'supplementary' ? financialYear - 6 : financialYear;
  const result = await repos.billingBatches.createBatch(
    regionId,
    batchType,
    startFinancialYear,
    financialYear,
    season
  );
  return result.rows[0];
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
  const { userEmail, regionId, batchType, financialYear, season } = request.payload;

  // create a new entry in the batch table
  const batch = await createBatch(regionId, batchType, financialYear, season);

  // add these details to the event log
  const batchEvent = await createBatchEvent(userEmail, batch);

  // add a new job to the queue so that the batch can be filled
  // with charge versions
  const message = populateBillingBatchJob.createMessage(batchEvent.event_id);
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

const getBatchInvoices = async request => {
  const { batchId } = request.params;
  const invoices = await repos.billingInvoices.findByBatchId(batchId);

  return invoices.length
    ? envelope(invoices, true)
    : Boom.notFound(`No invoices found for batch with id: ${batchId}`);
};

const getInvoiceDetail = async request => {
  const { invoiceId } = request.params;
  const invoice = await repos.billingInvoices.getInvoiceDetail(invoiceId);

  return invoice
    ? envelope(invoice, true)
    : Boom.notFound(`No invoice found with id: ${invoiceId}`);
};

exports.postCreateBatch = postCreateBatch;
exports.getBatch = getBatch;
exports.getBatchInvoices = getBatchInvoices;
exports.getInvoiceDetail = getInvoiceDetail;
