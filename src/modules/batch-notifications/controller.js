const Joi = require('joi');
const Boom = require('boom');
const { logger } = require('@envage/water-abstraction-helpers');
const { get, find } = require('lodash');

const evt = require('../../lib/event');

const { EVENT_STATUS_PROCESSED, EVENT_STATUS_SENDING } =
  require('./lib/event-statuses');
const { MESSAGE_STATUS_SENDING } = require('./lib/message-statuses');

const eventHelpers = require('./lib/event-helpers');
const messageHelpers = require('./lib/message-helpers');

const configs = require('./config');
const getRecipients = require('./lib/jobs/get-recipients');

/**
 * Prepares batch notification ready for sending
 * - Creates an event in the events table to describe the message
 * - Fires a PG boss event to prepare the messages ready for sending
 */
const postPrepare = async (request, h) => {
  const { messageType } = request.params;
  const { issuer, data } = request.payload;

  try {
    // Get message config based on message type
    const config = find(configs, { messageType });

    // Validate payload against schema defined in message config
    const { error } = Joi.validate(data, config.schema);
    if (error) {
      throw Boom.badRequest('Invalid payload', error);
    }

    // Generate an event
    const ev = await eventHelpers.createEvent(issuer, config, data);

    // Kick off PG boss job to get recipients
    await getRecipients.publish(ev.eventId);

    // Return event details
    return {
      error: null,
      data: ev
    };
  } catch (err) {
    const code = get(err, 'output.statusCode', 500);
    logger.error('Batch notification preparation error', err, { messageType, issuer, data });
    return h.response({
      error: err.message,
      data: null
    }).code(code);
  }
};

/**
 * Starts the sending process by:
 * - Updating event status to 'sending'
 * - Updating all related messages to 'sending'
 * They are then picked up for further processing by the relevant cron jobs
 */
const postSend = async (request, h) => {
  const { eventId } = request.params;

  try {
    // Load and check event
    const ev = await evt.load(eventId);

    if (!ev) {
      throw Boom.notFound(`Event ${eventId} not found`);
    }
    if (ev.status !== EVENT_STATUS_PROCESSED) {
      throw Boom.badRequest(`Event ${eventId} has invalid status ${ev.status}`);
    }

    // Update scheduled_notifications to new status
    const tasks = [
      messageHelpers.updateMessageStatuses(eventId, MESSAGE_STATUS_SENDING),
      eventHelpers.updateEventStatus(eventId, EVENT_STATUS_SENDING)
    ];

    const [, data] = await Promise.all(tasks);
    return { error: null, data };
  } catch (err) {
    const code = get(err, 'output.statusCode', 500);
    logger.error('Batch notification send error', err, { eventId });
    return h.response({
      error: err.message,
      data: null
    }).code(code);
  }
};

module.exports = {
  postPrepare,
  postSend
};
