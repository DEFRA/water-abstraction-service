'use strict'

const notifyConnector = require('../../../lib/connectors/notify')
const pdfCreator = require('../../../lib/services/pdf-generation/pdf')
const config = require('../../../../config')
const s3Connector = require('../../../lib/services/s3')

/**
 * Creates a string reference for a message in Notify so it can be
 * easily identified in the Notify UI
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {String}           notification reference
 */
const createNotifyReference = (scheduledNotification) => {
  const { id } = scheduledNotification
  const addressLine1 = scheduledNotification.personalisation.address_line_1
  return `${addressLine1} ${id}`
}

/**
 * Gets the notify template ID to use by inspecting the application config
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {String}                       - Notify template ID
 */
const getNotifyTemplate = scheduledNotification => {
  const { messageRef } = scheduledNotification
  return config.notify.templates[messageRef]
}

/**
 * Uploads the generated PDF message to the S3 bucket
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @param  {Buffer} pdf                   - the generated PDF message
 * @return {Promise}                        resolves with S3 response
 */
const uploadPDFtoS3 = (scheduledNotification, pdf) => {
  const fileName = `pdf-letters/${scheduledNotification.id}.pdf`
  return s3Connector.upload(fileName, pdf)
}

/**
 * Sends a PDF message and uploads the content to S3 for archive
 * @param  {Object}  client                - Notify client
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {Promise}                        resolves when message sent
 */
const sendPDF = async (client, scheduledNotification) => {
  const pdf = await pdfCreator.createPdfFromScheduledNotification(scheduledNotification)
  const notifyReference = createNotifyReference(scheduledNotification)

  const tasks = [
    uploadPDFtoS3(scheduledNotification, pdf),
    client.sendPrecompiledLetter(notifyReference, pdf)
  ]

  const [, notifyResponse] = await Promise.all(tasks)

  return notifyResponse
}

/**
 * Sends a letter via Notify API
 * @param  {Object}  client                - Notify client
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {Promise}                        resolves when message sent
 */
const sendLetter = async (client, scheduledNotification) => {
  const templateId = getNotifyTemplate(scheduledNotification)
  const { personalisation } = scheduledNotification
  return client.sendLetter(templateId, { personalisation })
}

/**
 * Sends an email via Notify API
 * @param  {Object}  client                - Notify client
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {Promise}                        resolves when message sent
 */
const sendEmail = async (client, scheduledNotification) => {
  const templateId = getNotifyTemplate(scheduledNotification)
  const { recipient, personalisation } = scheduledNotification
  return client.sendEmail(templateId, recipient, { personalisation })
}

/**
 * Gets the action to take based on the supplied scheduled_notification record
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {String}                         the action key
 */
const getAction = scheduledNotification => {
  const { messageType, messageRef } = scheduledNotification
  const isPdf = messageRef.startsWith('pdf.')
  return isPdf ? 'pdf' : messageType
}

const actions = {
  pdf: sendPDF,
  email: sendEmail,
  letter: sendLetter
}

/**
 * Sends a scheduled notification
 * @param  {Object} scheduledNotification - row from scheduled_notification table
 * @return {Promise}                       resolves when message is sent
 */
const send = async scheduledNotification => {
  const client = notifyConnector
    .getClient(scheduledNotification.messageType)

  // Get action
  const action = getAction(scheduledNotification)

  // Send message using relevant action
  return actions[action](client, scheduledNotification)
}

exports._createNotifyReference = createNotifyReference
exports._getNotifyTemplate = getNotifyTemplate
exports._uploadPDFToS3 = uploadPDFtoS3
exports._sendPDF = sendPDF
exports._sendLetter = sendLetter
exports._sendEmail = sendEmail
exports._getAction = getAction

exports.send = send
