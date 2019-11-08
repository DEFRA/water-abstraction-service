const { get } = require('lodash');
const messageQueue = require('../../../lib/message-queue');
const evt = require('../../../lib/event');

const { jobStatus } = require('../lib/batch');

const JOB_NAME = 'billing.populate-batch-transactions';

const publish = eventId => messageQueue.publish(JOB_NAME, { eventId });

const handlePopulateBatch = async job => {
  const eventId = get(job, 'data.eventId');
  const batchEvent = await evt.load(eventId);
  const { batch } = batchEvent.metadata;

  console.log(`handle: ${JOB_NAME}`, batch);

  batchEvent.status = jobStatus.complete;
  await evt.save(batchEvent);
};

exports.publish = publish;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
