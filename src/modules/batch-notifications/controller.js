const Joi = require('joi');
const Boom = require('boom');
const { logger } = require('@envage/water-abstraction-helpers');
const { get, find } = require('lodash');

const event = require('../../lib/event');
const generateReference = require('../../lib/reference-generator');

const configs = require('./config');
const getRecipients = require('./lib/jobs/get-recipients');

/**
 * Creates a notification event
 * @param  {String}  issuer - email address of user sending message
 * @param {Object} config   - message config
 * @param  {Object}  options   - message data - placed in event metadata
 * @return {Promise}          resolves with event data
 */
const createEvent = async (issuer, config, options) => {
  // Create a reference code
  const referenceCode = generateReference(config.prefix);

  const ev = event.create({
    referenceCode,
    type: 'notification',
    subtype: config.messageType,
    issuer,
    metadata: {
      options,
      name: config.name
    },
    status: 'processing'
  });
  await event.save(ev);
  return ev;
};

/**
 * Prepares batch notification ready for sending.
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
    const ev = await createEvent(issuer, config, data);

    // Kick off PG boss job to get recipients
    await getRecipients.publish(ev.eventId);

    // Return event details
    return {
      error: null,
      data: ev
    };
  } catch (err) {
    const code = get(err, 'output.statusCode', 500);
    logger.error('batch notification error', err, { messageType, issuer, data });
    return h.response({
      error: err.message,
      data: null
    }).code(code);
  }
};

module.exports = {
  postPrepare
};
