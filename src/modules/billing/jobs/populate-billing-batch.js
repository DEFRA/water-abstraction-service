const { get } = require('lodash');
const evt = require('../../../lib/event');

const JOB_NAME = 'billing.populateBatch';

/**
 * Formats job details ready to be published on PG boss
 * @param {String} eventId - GUID
 * @return {Object} ready to pass to PG boss publish() method
 */
const createMessage = eventId => ({
  name: JOB_NAME,
  data: { eventId }
});

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

exports.createMessage = createMessage;
exports.handler = handlePopulateBatch;
exports.jobName = JOB_NAME;
