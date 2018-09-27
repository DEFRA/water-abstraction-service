const NotifyClient = require('notifications-node-client').NotifyClient;
const { MessageTypeError } = require('../lib/errors');
const { createPdf } = require('../lib/pdf');

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
 * Gets the status of a Notify message
 * @param {String} notifyId
 * @return {Promise} resolves with message status
 */
const getStatus = async (notifyId) => {
  const client = new NotifyClient(process.env.LIVE_NOTIFY_KEY);
  const { body: { status } } = await client.getNotificationById(notifyId);
  return status;
};

/**
 * @param {Object} notifyTemplate - the data from the "water"."notify_templates" table
 * @param {Object} personalisation - personalisation of the notify template
 * @param {String} recipient - for SMS/email only
 */
async function send (notifyTemplate, personalisation, recipient) {
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
 * Generates a message preview
 * @param {Object} notifyTemplate - the data from the "water"."notify_templates" table
 * @param {Object} personalisation - personalisation of the notify template
 * @return {Promise} resolves with notify response
 */
async function preview (notifyTemplate, personalisation) {
  const { notify_key: notifyKey, template_id: templateId } = notifyTemplate;

  // Get API key and create client
  const apiKey = getNotifyKey(notifyKey);
  const notifyClient = new NotifyClient(apiKey);

  // check template exists in notify
  await notifyClient.getTemplateById(templateId);

  // Create Notify client and preview template
  return notifyClient.previewTemplateById(templateId, personalisation);
}

/**
 * Gets notify key to use
 * this is always a test key unless in production
 * @return {String}
 */
const getPdfNotifyKey = (env) => {
  if (env.NODE_ENV === 'prod') {
    return env.LIVE_NOTIFY_KEY;
  }
  return env.TEST_NOTIFY_KEY;
};

/**
 * Sends a PDF as a letter via Notify
 * @param {String} url
 * @param {String} id
 * @return {Promise} resolves with Notify response
 */
async function sendPdf (url, id) {
  const notifyClient = new NotifyClient(getPdfNotifyKey(process.env));
  const pdf = await createPdf(url);
  return notifyClient.sendPrecompiledLetter(
    id,
    pdf
  );
}

module.exports = {
  getNotifyKey,
  getStatus,
  preview,
  send,
  getPdfNotifyKey,
  sendPdf
};
