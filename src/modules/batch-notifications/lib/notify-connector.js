const NotifyClient = require('notifications-node-client').NotifyClient;
const { get } = require('lodash');
const pdfCreator = require('../../../lib/notify/pdf');
const config = require('../../../../config');
const s3Connector = require('../../../lib/connectors/s3');

/**
 * Gets the Notify API key.
 * @TODO we may need per-message type/environment config of key selection
 * @param  {Object} env  Node environment
 * @param  {String} type Message type email|letter
 * @return {String}      Notify API key
 */
const getNotifyKey = (env, type) => {
  if (env.NODE_ENV === 'production') {
    return env.LIVE_NOTIFY_KEY;
  }
  return type === 'email' ? env.LIVE_NOTIFY_KEY : env.TEST_NOTIFY_KEY;
};

/**
 * Creates a string reference for a message in Notify so it can be
 * easily identified in the Notify UI
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {String}           notification reference
 */
const createNotifyReference = (scheduledNotification) => {
  const id = get(scheduledNotification, 'id');
  const addressLine1 = get(scheduledNotification, 'personalisation.address_line_1');
  const postcode = get(scheduledNotification, 'personalisation.postcode');
  return `${addressLine1} ${postcode} ${id}`;
};

/**
 * Gets the notify template ID to use by inspecting the application config
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {String}                       - Notify template ID
 */
const getNotifyTemplate = scheduledNotification => {
  const messageType = get(scheduledNotification, 'message_ref');
  return get(config, `notify.templates.${messageType}`);
};

/**
 * Uploads the generated PDF message to the S3 bucket
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @param  {Buffer} pdf                   - the generated PDF message
 * @return {Promise}                        resolves with S3 response
 */
const uploadPDFtoS3 = (scheduledNotification, pdf) => {
  const fileName = `pdf-letters/${scheduledNotification.id}.pdf`;
  return s3Connector.upload(fileName, pdf);
};

/**
 * Sends a PDF message and uploads the content to S3 for archive
 * @param  {Object}  client                - Notify client
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {Promise}                        resolves when message sent
 */
const sendPDF = async (client, scheduledNotification) => {
  const pdf = await pdfCreator.createPdf(scheduledNotification.id);
  const notifyReference = createNotifyReference(scheduledNotification);

  const tasks = [
    uploadPDFtoS3(scheduledNotification, pdf),
    client.sendPrecompiledLetter(notifyReference, pdf)
  ];

  const [, notifyResponse] = await Promise.all(tasks);

  return notifyResponse;
};

/**
 * Sends a letter via Notify API
 * @param  {Object}  client                - Notify client
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {Promise}                        resolves when message sent
 */
const sendLetter = async (client, scheduledNotification) => {
  const templateId = getNotifyTemplate(scheduledNotification);
  const { personalisation } = scheduledNotification;
  return client.sendLetter(templateId, { personalisation });
};

/**
 * Sends an email via Notify API
 * @param  {Object}  client                - Notify client
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {Promise}                        resolves when message sent
 */
const sendEmail = async (client, scheduledNotification) => {
  const templateId = getNotifyTemplate(scheduledNotification);
  const { recipient, personalisation } = scheduledNotification;
  return client.sendEmail(templateId, recipient, { personalisation });
};

/**
 * Gets the action to take based on the supplied scheduled_notification record
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {String}                         the action key
 */
const getAction = scheduledNotification => {
  const { message_type: type, message_ref: ref } = scheduledNotification;
  const isPdf = ref.startsWith('pdf.');
  return isPdf ? 'pdf' : type;
};

const actions = {
  pdf: sendPDF,
  email: sendEmail,
  letter: sendLetter
};

/**
 * Sends a scheduled notification
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {Promise}                       resolves when message is sent
 */
const send = async scheduledNotification => {
  // Create Notify client
  const key = getNotifyKey(process.env, scheduledNotification.message_type);
  const client = new NotifyClient(key);

  // Get action
  const action = getAction(scheduledNotification);

  // Send message using relevant action
  return actions[action](client, scheduledNotification);
};

exports._getNotifyKey = getNotifyKey;
exports._createNotifyReference = createNotifyReference;
exports._getNotifyTemplate = getNotifyTemplate;
exports._uploadPDFToS3 = uploadPDFtoS3;
exports._sendPDF = sendPDF;
exports._sendLetter = sendLetter;
exports._sendEmail = sendEmail;
exports._getAction = getAction;

exports.send = send;
