const Joi = require('joi');
const NotifyClient = require('notifications-node-client').NotifyClient;
const notifyTemplateRepo = require('../../controllers/notifytemplates').repository;
const { TemplateNotFoundError, MessageTypeError } = require('./errors');
const { createGUID } = require('../../lib/helpers');

/**
 * A function to get the notify key
 * The key stored in the DB can be an actual key, or it can refer
 * to an environment variable as follows:
 * test:  TEST_NOTIFY_KEY
 * whitelist: WHITELIST_NOTIFY_KEY
 * live: LIVE_NOTIFY_KEY
 * @param {String} a reference to a notify key: test|whitelist|live to be
 *                 loaded from environment variable, or a full key
 * @return {String} notify key
 */
function getNotifyKey (key) {
  const lKey = key.toLowerCase();
  const keys = {
    test: process.env.TEST_NOTIFY_KEY,
    whitelist: process.env.WHITELIST_NOTIFY_KEY,
    live: process.env.LIVE_NOTIFY_KEY
  };
  if (lKey in keys) {
    return keys[lKey];
  }
  return key;
}

/**
 * Loads the notify template info from the DB
 * @param {String} messageRef
 * @return {Promise} resolves with object of notify template data
 */
async function getTemplate (messageRef) {
  // Load template
  const { error, rows: [notifyTemplate] } = await notifyTemplateRepo.find({ message_ref: messageRef });

  if (error) {
    throw error;
  }
  if (!notifyTemplate) {
    throw new TemplateNotFoundError(`Template for message ${messageRef} not found`);
  }

  return notifyTemplate;
}

/**
 * @param {Object} notifyTemplate - the data from the "water"."notify_templates" table
 * @param {Object} personalisation - personalisation of the notify template
 * @param {String} recipient - for SMS/email only
 */
async function sendMessage (notifyTemplate, personalisation, recipient) {
  const { notify_key: notifyKey, template_id: templateId } = notifyTemplate;

  // Get API key and create client
  const apiKey = getNotifyKey(notifyKey);
  const notifyClient = new NotifyClient(apiKey);

  // check template exists in notify
  const template = await notifyClient.getTemplateById(templateId);

  const { type } = template.body;

  switch (type) {
    case 'sms':
      return notifyClient.sendSms(templateId, recipient, {personalisation});

    case 'email':
      return notifyClient.sendEmail(templateId, recipient, {personalisation});

    case 'letter':
      return notifyClient.sendLetter(templateId, {personalisation});

    default:
      throw new MessageTypeError(`Message type ${type} not found`);
  }
}

/**
 * Validates the options passed to enqueue
 * @param {Object} options
 * @param {String} now - ISO 8601 current timestamp
 * @return {Object} - with {error, value }
 */
function validateEnqueueOptions (options, now) {
  // Validate input options
  const schema = {
    id: Joi.string().default(createGUID()),
    messageRef: Joi.string(),
    recipient: Joi.string().default('n/a'),
    personalisation: Joi.object(),
    sendAfter: Joi.string().default(now),
    licences: Joi.array().items(Joi.string()).default([]),
    individualEntityId: [Joi.allow(null), Joi.string().guid()],
    companyEntityId: [Joi.allow(null), Joi.string().guid()],
    eventId: Joi.string().guid(),
    metadata: Joi.object().default({})
  };

  return Joi.validate(options, schema);
}

module.exports = {
  getNotifyKey,
  getTemplate,
  sendMessage,
  validateEnqueueOptions
};
