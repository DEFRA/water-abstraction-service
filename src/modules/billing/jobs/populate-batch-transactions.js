const { get } = require('lodash');
const evt = require('../../../lib/event');

const { jobStatus } = require('../lib/batch');

const JOB_NAME = 'billing.populate-batch-transactions';

const createMessage = eventId => ({
  name: JOB_NAME,
  data: { eventId }
});

const handlePopulateBatch = async job => {
  const eventId = get(job, 'data.eventId');
  const batchEvent = await evt.load(eventId);
  const { batch } = batchEvent.metadata;

  console.log(`handle: ${JOB_NAME}`, batch);

  batchEvent.status = jobStatus.complete;
  await evt.save(batchEvent);
};

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
