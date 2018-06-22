const Boom = require('boom');
const moment = require('moment');
const messageQueue = require('../../lib/message-queue');

const { enqueue } = require('./index.js')(messageQueue);

/**
 * Gets the notify template ID for a notify message ref,
 * and sends it using the notify API
 *
 *  Sample CURL
 *  curl -X POST '../notify/password_reset_email' -d '{"recipient":"email@email.com","personalisation":{"firstname":"name","reset_url":"url"}}'
 *
 * @param {Object} request - the HAPI HTTP request
 * @param {Object} [request.query] - GET query params
 * @param {String} [request.query.recipient] - recipient of the notify message
 * @param {String} [request.query.message_ref] - the internal ref of the message to be sent
 * @param {String} [request.payload.personalisation] - the personalisation packet
 * @param {Object} reply - the HAPI HTTP response
 */
async function send (request, reply) {
  const { message_ref: messageRef } = request.params;
  const { id, recipient, personalisation, sendafter } = request.payload;

  const config = {
    id,
    messageRef,
    recipient,
    personalisation,
    sendAfter: sendafter ? moment(sendafter).format() : undefined
  };

  try {
    await enqueue(config);
    return config;
  } catch (err) {
    if (err.statusCode === 400) {
      throw Boom.badRequest(err);
    }
    if (err.name === 'TemplateNotFoundError') {
      throw Boom.badRequest(err);
    }
    throw err;
  }
}

module.exports = {
  send
};
