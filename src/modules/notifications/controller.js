'use strict'

/**
 * Controller methods to send/preview notifications
 * @module src/modules/notifications/controller
 */
const { prepareNotification, sendNotification } = require('./lib')
const taskConfigLoader = require('./lib/task-config-loader')
const generateReference = require('../../lib/reference-generator')
const eventsService = require('../../lib/services/events')
const scheduledNotificationsService = require('../../lib/services/scheduled-notifications')

/**
 * @param { Object } request.payload.filter - standard filter
 * @param { Object } request.payload.params - variables that will be merged into the template *
 * @param { Number } request.payload.taskConfigId - the ID of the notification task in the task_config table *
 */
async function postPreview (request, reply) {
  const { filter, taskConfigId, params } = request.payload
  const taskConfig = await taskConfigLoader(taskConfigId)
  const data = await prepareNotification(filter, taskConfig, params, { ref: 'SAMPLE' })
  return { error: null, data }
}

/**
 * Send a notification
 * The process is:
 * - select template (and personalisation variables)
 * - select audience (licence numbers)
 * - generate contact list
 * - send
 *
 * Process in detail:
 *
 * 1. Build contact list
 * - get list of contacts from CRM data
 * - de-duplicate, select most relevant contacts
 *
 * 2. Build template view context for each licence
 * - supplied template parameters (per batch)
 * - task configuration data (per task)
 * - pull all licences from permit repo, run them through NALD licence transformer (per de-duped licence list)
 *
 * 3. Render template content
 * - use Nunjucks to render view context data with selected template
 *
 * 4. Send
 * - create batch send message in event log
 * - send each message
 *
 * @param {Object} request.payload.filter - standard filter for selecting licences from CRM
 * @param {Object} request.payload.params - variables that will be merged into the template
 * @param {Number} request.payload.taskConfigId - the ID of the notification task in the task_config table
 */
async function postSend (request, reply) {
  const { filter, taskConfigId, params, sender, uniqueJobId } = request.payload
  const taskConfig = await taskConfigLoader(taskConfigId)
  const ref = generateReference(taskConfig.config.prefix)
  const data = await prepareNotification(filter, taskConfig, params, { ref })
  await sendNotification(request.queueManager, taskConfig, sender, data, ref, uniqueJobId)
  return { error: null, data }
}

const mapNotificationEvent = (notification) => {
  const { id, issuer, type, subtype, errorCount, created, referenceCode } = notification
  return {
    ...{ id, issuer, type, subtype, errorCount, created, referenceCode },
    name: notification.metadata.name,
    options: notification.metadata.options ?? {},
    recipientCount: notification.metadata.recipients
  }
}

/**
 * Gets a paginated list of sent notifications.
 * These are stored in the water.events table with a type of 'notification'
 */
const getNotifications = async request => {
  const { page, categories, sender } = request.query
  const { data, pagination } = await eventsService.getNotificationEvents(page, categories, sender)

  return {
    data: data.map(mapNotificationEvent),
    pagination
  }
}

/**
 * Get a single notification including the event and messages
 */
const getNotification = async request => mapNotificationEvent(request.pre.event)

/**
 * Get a list of scheduled_notifications messages for the specified
 * notification event
 */
const getNotificationMessages = async request => {
  const { eventId } = request.params
  const messages = await scheduledNotificationsService.getByEventId(eventId)
  return {
    data: messages
  }
}

const getNotificationMessage = async request => {
  const { id } = request.params
  const message = await scheduledNotificationsService.getScheduledNotificationById(id)
  return {
    data: message
  }
}

const getNotificationCategories = () => scheduledNotificationsService.getNotificationCategories()

module.exports = {
  postPreview,
  postSend,
  getNotifications,
  getNotification,
  getNotificationMessages,
  getNotificationMessage,
  getNotificationCategories
}
