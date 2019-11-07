const { get } = require('lodash');
const messageQueue = require('../../../lib/message-queue');
const evt = require('../../../lib/event');

const JOB_NAME = 'billing.populateBatch';

const publish = eventId => {
  const data = { eventId };
  return messageQueue.publish(JOB_NAME, data);
};

const handlePopulateBatch = async job => {
  // Minimal skeleton implementation at this stage before
  // real work carried out in separate ticket
  const eventId = get(job, 'data.eventId');
  const batchEvent = await evt.load(eventId);

  // event is loaded and will contain metadata representing the batch
  // --------------------------------
  // WORK PENDING IN WATER-2383
  // --------------------------------

  // when everything is complete the event can be updated with
  // a new status
  batchEvent.status = 'complete';
  await evt.save(batchEvent);
};

exports.publish = publish;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
