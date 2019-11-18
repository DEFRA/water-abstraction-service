const { get } = require('lodash');
const evt = require('../../../lib/event');
const { chargeVersions } = require('../../../lib/connectors/repository');

const JOB_NAME = 'billing.populate-batch-charge-versions';

const { isSupplementaryBatch, jobStatus } = require('../lib/batch');

const createMessage = eventId => ({
  name: JOB_NAME,
  data: { eventId }
});

/**
 * Handles a batch that is supplementary
 *
 * @param {Object} job PG-Boss job object
 * @param {Object} batchEvent The event record that is tracking the batch run
 */
const handleSupplementaryBatch = async (job, batchEvent) => {
  const { batch } = batchEvent.metadata;

  // move any found charge versions into water.billing_batch_charge_versions
  const rows = await chargeVersions.createSupplementaryChargeVersions(batch);

  batchEvent.status = rows.length === 0 ? jobStatus.complete : jobStatus.findingTransactions;
  await evt.save(batchEvent);

  // Include the charge versions in the response data. This information
  // can then be used in the onComplete callback to decide if a new job
  // should be published.
  return job.done(null, { chargeVersions: rows, batch });
};

const handlePopulateBatch = async job => {
  const eventId = get(job, 'data.eventId');
  const batchEvent = await evt.load(eventId);
  const { batch } = batchEvent.metadata;

  if (isSupplementaryBatch(batch)) {
    return handleSupplementaryBatch(job, batchEvent);
  } else {
    console.log('handle annual batches in a future story');
    batchEvent.status = jobStatus.complete;
    await evt.save(batchEvent);
  }
};

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
