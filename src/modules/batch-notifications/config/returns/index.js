const Joi = require('joi');
const { getRecipients } = require('./lib/get-recipients');
const { createEvent } = require('./lib/create-event');

const schema = {
  excludeLicences: Joi.array().items(Joi.string().trim())
};

module.exports = [{
  prefix: 'RINV-',
  name: 'Returns: invitation',
  messageType: 'returnInvitation',
  schema,
  getRecipients,
  createEvent
}, {
  prefix: 'RREM-',
  name: 'Returns: reminder',
  messageType: 'returnReminder',
  schema,
  getRecipients,
  createEvent
}];
