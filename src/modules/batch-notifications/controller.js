const Joi = require('@hapi/joi');
const Boom = require('@hapi/boom');
const { logger } = require('../../logger');
const { get, find } = require('lodash');

const { EVENT_STATUS_PROCESSED, EVENT_STATUS_SENDING } =
  require('./lib/event-statuses');
const { MESSAGE_STATUS_SENDING } = require('./lib/message-statuses');

const messageHelpers = require('./lib/message-helpers');

const configs = require('./config');
const getRecipients = require('./lib/jobs/get-recipients');

const eventsService = require('../../lib/services/events');

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

    // Create and persist event
    let ev = await config.createEvent(issuer, config, data);
    ev = await eventsService.create(ev);

    // Kick off PG boss job to get recipients
    await getRecipients.publish(ev.id);

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
 * Checks event is valid for sending - throws Boom errors if invalid
 * - event is found
 * - event.type is "notification"
 * - event.status is "processed"
 * - event.issuer is same as that in request payload
 * @param  {Object} ev      - event object
 * @param  {Object} request HAPI request
 */
const checkEventIsValid = (ev, request) => {
  const { eventId } = request.params;
  const { issuer } = request.payload;

  if (!ev) {
    throw Boom.notFound(`Event ${eventId} not found`);
  }
  if (ev.type !== 'notification') {
    throw Boom.badRequest(`Event ${eventId} is not a notification`);
  }
  if (ev.status !== EVENT_STATUS_PROCESSED) {
    throw Boom.badRequest(`Event ${eventId} has invalid status ${ev.status}`);
  }
  if (ev.issuer !== issuer) {
    throw Boom.unauthorized(`Event ${eventId} issuer does not match that supplied`);
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
    const event = await eventsService.findOne(eventId);

    checkEventIsValid(event, request);

    // Update scheduled_notifications to new status
    const tasks = [
      messageHelpers.updateMessageStatuses(event.id, MESSAGE_STATUS_SENDING),
      eventsService.updateStatus(event.id, EVENT_STATUS_SENDING)
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
