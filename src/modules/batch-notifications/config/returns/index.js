const Joi = require('@hapi/joi');
const { getRecipients } = require('./lib/get-recipients');

const schema = {
  excludeLicences: Joi.array().items(Joi.string().trim())
};

module.exports = [{
  prefix: 'RINV-',
  name: 'Returns: invitation',
  messageType: 'returnInvitation',
  schema,
  getRecipients
}, {
  prefix: 'RREM-',
  name: 'Returns: reminder',
  messageType: 'returnReminder',
  schema,
  getRecipients
}];
