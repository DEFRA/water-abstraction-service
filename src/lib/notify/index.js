'use strict'

const { MessageTypeError } = require('./errors')
const notifyConnector = require('../connectors/notify')
const scheduledNotificationService = require('../services/scheduled-notifications')
const pdfGenerator = require('../services/pdf-generation/pdf')

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
  const lKey = key.toLowerCase()
  const keys = {
    test: process.env.TEST_NOTIFY_KEY,
    whitelist: process.env.WHITELIST_NOTIFY_KEY,
    live: process.env.LIVE_NOTIFY_KEY
  }
  if (lKey in keys) {
    return keys[lKey]
  }
  return key
}

/**
 * Gets the status of a Notify message
 * @param {String} notifyId
 * @return {Promise} resolves with message status
 */
const getStatus = async (notifyId) => {
  const client = notifyConnector.getClient()
  const { body: { status } } = await client.getNotificationById(notifyId)
  return status
}

/**
 * @param {Object} notifyTemplate - the data from the "water"."notify_templates" table
 * @param {Object} personalisation - personalisation of the notify template
 * @param {String} recipient - for SMS/email only
 */
async function send (notifyTemplate, personalisation, recipient) {
  const { template_id: templateId } = notifyTemplate

  const template = await notifyConnector
    .getClient()
    .getTemplateById(templateId)

  const { type } = template.body

  switch (type) {
    case 'sms':
      return notifyConnector.getClient(notifyConnector.messageTypes.sms)
        .sendSms(templateId, recipient, { personalisation })

    case 'email':
      return notifyConnector.getClient(notifyConnector.messageTypes.email)
        .sendEmail(templateId, recipient, { personalisation })

    case 'letter':
      return notifyConnector.getClient(notifyConnector.messageTypes.letter)
        .sendLetter(templateId, { personalisation })

    default:
      throw new MessageTypeError(`Message type ${type} not found`)
  }
}

/**
 * Generates a message preview
 * @param {Object} notifyTemplate - the data from the "water"."notify_templates" table
 * @param {Object} personalisation - personalisation of the notify template
 * @return {Promise} resolves with notify response
 */
async function preview (notifyTemplate, personalisation) {
  const { template_id: templateId } = notifyTemplate

  return notifyConnector
    .getClient()
    .previewTemplateById(templateId, personalisation)
}

/**
 * Gets notify key to use
 * this is always a test key unless in production
 * @return {String}
 */
const getPdfNotifyKey = (env) => {
  if (env.ENVIRONMENT === 'prd') {
    return env.LIVE_NOTIFY_KEY
  }
  return env.TEST_NOTIFY_KEY
}

/**
 * Sends a PDF as a letter via Notify
 * @param {String} notificationId - ID in scheduled_notification table
 * @param {String} notifyId - an ID sent to notify to identify the message
 * @return {Promise} resolves with Notify response
 */
const sendPdf = async (notificationId, notifyId) => {
  const notification = await scheduledNotificationService.getScheduledNotificationById(notificationId)
  const pdf = await pdfGenerator.createPdfFromScheduledNotification(notification)

  return notifyConnector
    .getClient(notifyConnector.messageTypes.letter)
    .sendPrecompiledLetter(notifyId, pdf)
}

const sendEmail = async (notifyTemplateId, recipient, personalisation) => {
  return notifyConnector.getClient(notifyConnector.messageTypes.email)
    .sendEmail(notifyTemplateId, recipient, { personalisation })
}

exports.sendEmail = sendEmail
exports.getNotifyKey = getNotifyKey
exports.getStatus = getStatus
exports.preview = preview
exports.send = send
exports.getPdfNotifyKey = getPdfNotifyKey
exports.sendPdf = sendPdf
