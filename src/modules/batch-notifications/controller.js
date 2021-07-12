'use strict';

const Joi = require('joi');
const Boom = require('@hapi/boom');
const { logger } = require('../../logger');
const { get, find } = require('lodash');

const configs = require('./config');
const getRecipients = require('./lib/jobs/get-recipients');

const eventsService = require('../../lib/services/events');
const sendBatch = require('./lib/send-batch');
const mapErrorResponse = require('../../lib/map-error-response');

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
 * Starts the sending process by:
 * - Updating event status to 'sending'
 * - Updating all related messages to 'sending'
 * They are then picked up for further processing by the relevant cron jobs
 */
const postSend = async request => {
  const { eventId } = request.params;
  const { issuer } = request.payload;

  try {
    const event = await sendBatch.send(eventId, issuer);

    return { error: null, data: event };
  } catch (err) {
    logger.error('Batch notification send error', err, { eventId });
    return mapErrorResponse(err);
  }
};

module.exports = {
  postPrepare,
  postSend
};
