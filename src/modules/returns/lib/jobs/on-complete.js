const { logger } = require('../../../../logger');
const eventsService = require('../../../../lib/services/events');
const errorEvent = require('./error-event');

const getName = job => job.data.request.name;
const getEventId = job => job.data.request.data.eventId;

const handleFailedJob = async job => {
  const name = getName(job);
  const eventId = getEventId(job);

  // Log failure
  const err = new Error(`${name} job failed`);
  logger.error(`${name} job failed`, err, { name, eventId });

  // Update event
  const event = await eventsService.findOne(eventId);
  if (event) {
    return errorEvent.setEventError(event, err);
  }
};

const handler = (job, messageQueue, nextJob) => {
  logger.info(`handling onComplete ${getName(job)}`);

  // Log failed job
  if (job.data.failed) {
    return handleFailedJob(job);
  }

  // Process next job in saga
  if (nextJob) {
    const message = nextJob.createMessage(job.data.request.data);
    return messageQueue.publish(message);
  }
};

module.exports = handler;
