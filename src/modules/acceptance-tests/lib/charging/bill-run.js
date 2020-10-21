'use-strict';
const chargeModuleBillRunConnector = require('../../../../lib/connectors/charge-module/bill-runs');
const batches = require('./batches');
const promisePoller = require('promise-poller').default;
const batchService = require('../../../billing/services/batch-service');
const createBillRunJob = require('../../../billing/jobs/create-bill-run');
const { createBatchEvent } = require('../../../billing/lib/batch-event');

const createBatchAndExecuteBillRun = async (request, regionId, type = 'annual', financialYearEnding = 2020, isSummer = false) => {
  // create a new entry in the batch table
  const batch = await batchService.create(regionId, type, financialYearEnding, isSummer);

  // add these details to the event log
  const batchEvent = await createBatchEvent({
    issuer: 'test@example.com',
    batch,
    subtype: batch.type,
    status: 'start'
  });

  // add a new job to the queue so that the batch can be created in the CM
  const message = createBillRunJob.createMessage(batchEvent.id, batch);
  await request.messageQueue.publish(message);

  const annualBatch = await getBatchWhenProcessed(batch.id);
  if (annualBatch.status === 'error') { return annualBatch; }

  // mark the annual batch as sent so a new batch for the same
  // region can be created
  await chargeModuleBillRunConnector.approve(annualBatch.externalId);
  await chargeModuleBillRunConnector.send(annualBatch.externalId);

  // Update the status to sent
  await batches.updateStatus(annualBatch.billingBatchId, 'sent');

  return annualBatch;
};

/**
 * Gets batch by ID.
 * If batch is not processed, an error is thrown
 * @param {String} batchId
 * @return {Promise<Object>}
 */
const getProcessedBatch = async batchId => {
  const batch = await batches.getBatchById(batchId);
  console.log(`Test: polling batch - ${batchId}, status - ${batch.status}`);
  if (batch.status === 'processing') {
    throw new Error('Batch still processing');
  }
  return batch;
};

/**
 * Gets batch when processing is complete
 * @return {Promise}
 */
const getBatchWhenProcessed = batchId => promisePoller({
  taskFn: () => getProcessedBatch(batchId),
  interval: 5000,
  retries: 30
});

exports.createBatchAndExecuteBillRun = createBatchAndExecuteBillRun;
