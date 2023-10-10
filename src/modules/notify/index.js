/**
 * Notify flow:
 * - enqueue - adds record in scheduled_notification table, fire 'send' now or in future
 * - send - sends notify message, fire 'status' at several regular intervals in future
 * - status - checks status in notify, updates scheduled_notification table
 */
const Boom = require('@hapi/boom')
const notify = require('../../lib/notify')
const { validateEnqueueOptions, isPdf } = require('./lib/helpers')
const { createFromObject } = require('./connectors/scheduled-notification')
const { findByMessageRef } = require('./connectors/notify-template')
const { HIGH_PRIORITY, LOW_PRIORITY } = require('../../lib/priorities')
const notifySend = require('./lib/notify-send')

/**
 * @param {Object} row - row data
 */
async function scheduleSendEvent (queueManager, row, rowJobId) {
  // Give email/SMS higher priority than letter
  const priority = row.message_type === 'letter' ? LOW_PRIORITY : HIGH_PRIORITY

  const options = {
    singletonKey: rowJobId,
    priority,
    expireIn: '1 day'
  }

  return queueManager.add(notifySend.jobName, row, options)
}

/**
 * For messages which use a Notify template, this function
 * gets the appropriate Notify key and creates message preview
 */
const getNotifyPreview = async (data) => {
  // Determine notify key/template ID and generate preview
  const template = await findByMessageRef(data.messageRef)
  const { body: { body: plaintext, type } } = await notify.preview(template, data.personalisation)

  return {
    ...data,
    plaintext,
    messageType: type
  }
}

/**
 * Queues a message ready for sending.  For standard Notify message
 * a preview is generated and stored in scheduled_notification table
 * For PDF messages, this does not happen
 */
const enqueue = async (queueManager, rowJobId, options = {}) => {
  const { value: data, error } = validateEnqueueOptions(options)

  if (error) {
    throw Boom.badRequest('Invalid message enqueue options', error)
  }

  // For non-PDF  messages, generate preview and add to data
  const row = isPdf(options.messageRef) ? data : await getNotifyPreview(data)

  // Persist row to scheduled_notification table
  const dbRow = await createFromObject(row)

  // Schedules send event
  scheduleSendEvent(queueManager, dbRow, rowJobId)

  // Return row data
  return { data: dbRow }
}

const registerSubscribers = queueManager => {
  queueManager.register(notifySend)
}

module.exports = {
  enqueue,
  registerSubscribers
}
