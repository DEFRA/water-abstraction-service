const { get } = require('lodash');
const Boom = require('@hapi/boom');
const eventsService = require('../../lib/services/events');
const returnsUpload = require('./lib/returns-upload');

/**
 * Pre-handler to load event with requested ID
 * @param {String} request.params.eventId - the upload event ID
 */
const preLoadEvent = async (request, h) => {
  const { eventId } = request.params;

  // Load event - 404 if not found
  request.event = await eventsService.findOne(eventId);
  if (!request.event) {
    throw Boom.notFound('Return upload event not found', { eventId });
  }

  return h.continue;
};

/**
 * Pre-handler to load return JSON from S3 bucket
 * @type {Object}
 */
const preLoadJson = async (request, h) => {
  const { eventId } = request.params;
  const response = await returnsUpload.getReturnsS3Object(eventId, 'json');
  request.jsonData = JSON.parse(response.Body.toString());
  return h.continue;
};

/**
 * Pre-handler to check the event loaded and attached to the HAPI request
 * has the same issuer email address as the username present in the
 * request payload
 * Throws Boom.unauthorized if no match
 * @param  {Object}  request.event  - event loaded by preLoadEvent
 * @param {String} request.payload.userName - current user email address
 * @return {Promise} resolves with h.continue
 */
const preCheckIssuer = async (request, h) => {
  const issuer = get(request, 'query.userName');
  const originalIssuer = get(request, 'event.issuer');
  const eventId = get(request, 'event.id');

  if (issuer !== originalIssuer) {
    throw Boom.unauthorized('Return upload permission denied', { eventId, issuer, originalIssuer });
  }
  return h.continue;
};

module.exports = {
  preLoadEvent,
  preLoadJson,
  preCheckIssuer
};
