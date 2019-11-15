const Boom = require('@hapi/boom');
const repos = require('../../lib/connectors/repository');
const event = require('../../lib/event');

const { envelope, errorEnvelope } = require('../../lib/response');
const populateBatchChargeVersionsJob = require('./jobs/populate-batch-charge-versions');
const { jobStatus } = require('./lib/batch');

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

const createBatch = (regionId, batchType, financialYear, season) => {
  return repos.billingBatches.createBatch(regionId, batchType, financialYear, season);
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

  if (!batch) {
    const data = errorEnvelope(`Batch already processing for region ${regionId}`);
    return h.response(data).code(409);
  }

  // add these details to the event log
  const batchEvent = await createBatchEvent(userEmail, batch);

  // add a new job to the queue so that the batch can be filled
  // with charge versions
  populateBatchChargeVersionsJob.publish(batchEvent.event_id);

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
