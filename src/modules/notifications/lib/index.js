const evt = require('../../../lib/event')
const { contactList } = require('../../../lib/contact-list')
const licenceLoader = require('./licence-loader')
const templateRenderer = require('./template-renderer')
const eventFactory = require('./event-factory')
const notificationFactory = require('./notification-factory')

const { enqueue } = require('../../notify')
const defaultRolePriority = ['document_notifications', 'notifications', 'area_import', 'licence_contact', 'licence_holder']

const { logger } = require('../../../logger')

/* eslint camelcase: "warn" */

/**
 * Method which can be shared between preview/send
 *
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
 * @param {Object} filter - the filter for searching for licences in CRM
 * @param {Object} taskConfig - task configuration data from water.task_config table
 * @param {Object} params - template parameters
 * @param {Object} context - additional view context, used to pass reference code through to template
 * @return {Promise} resolves with array of contacts, licences, and rendered messages to send via Notify
 */
async function prepareNotification (filter, taskConfig, params, context = {}) {
  // Get a list of de-duped contacts with licences
  const rolePriority = taskConfig.config.role_priority || defaultRolePriority
  const contacts = await contactList(filter, rolePriority)

  // Load licence data from permit repo, and use NALD licence transformer
  // to transform to same format used in front-end GUI
  const licenceData = await licenceLoader(contacts)

  return templateRenderer(taskConfig, params, contacts, licenceData, context)
}

/**
 * Send notification
 * We need to:
 * - Create batch event GUID and reference number
 * - Compose each message's Notify packet and send
 * - Update the batch event status
 * @param {Object} queueManager - BullMQ Queue manager
 * @param {Object} taskConfig - task configuration data from water.task_config table
 * @param {String} issuer - email address
 * @param {Array} contactData - data from prepare step above
 * @param {String} ref - unique reference for this message batch
 */
async function sendNotification (queueManager, taskConfig, issuer, contactData, ref, uniqueJobId) {
  // Create event
  const e = eventFactory(issuer, taskConfig, contactData, ref)
  await evt.save(e)

  logger.info(`Sending notification reference ${e.referenceCode} ID ${e.eventId}`)

  // Schedule messages for sending
  let rowCount = 0
  for (const row of contactData) {
    rowCount++
    const n = await notificationFactory(row, taskConfig, e)
    n.notificationType = taskConfig.task_config_id
    const rowJobId = uniqueJobId + rowCount

    try {
      await enqueue(queueManager, rowJobId, n)
    } catch (error) {
      logger.error('Error sending notification', error.stack)
    }
  }

  // Update event status
  e.status = 'sent'
  return evt.save(e)
}

module.exports = {
  prepareNotification,
  sendNotification
}
