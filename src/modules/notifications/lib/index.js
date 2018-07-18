const getContactList = require('./contact-list');
const licenceLoader = require('./licence-loader');
const templateRenderer = require('./template-renderer');
const eventFactory = require('./event-factory');
const notificationFactory = require('./notification-factory');

const messageQueue = require('../../../lib/message-queue');
const { enqueue } = require('../../notify')(messageQueue);
const defaultRolePriority = ['document_notifications', 'notifications', 'area_import', 'licence_contact', 'licence_holder'];

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
  const rolePriority = taskConfig.config.role_priority || defaultRolePriority;
  const contacts = await getContactList(filter, rolePriority);

  // Load licence data from permit repo, and use NALD licence transformer
  // to transform to same format used in front-end GUI
  const licenceData = await licenceLoader(contacts);

  return templateRenderer(taskConfig, params, contacts, licenceData, context);
}

/**
 * Send notification
 * We need to:
 * - Create batch event GUID and reference number
 * - Compose each message's Notify packet and send
 * - Update the batch event status
 * @param {Object} taskConfig - task configuration data from water.task_config table
 * @param {String} issuer - email address
 * @param {Array} contactData - data from prepare step above
 * @param {String} ref - unique reference for this message batch
 */
async function sendNotification (taskConfig, issuer, contactData, ref) {
  // Create event
  const e = eventFactory(issuer, taskConfig, contactData, ref);
  await e.save();

  console.log(`Sending notification reference ${e.getReference()} ID ${e.getId()}`);

  // Schedule messages for sending
  for (let row of contactData) {
    let n = await notificationFactory(row, taskConfig, e);

    try {
      enqueue(n);
    } catch (error) {
      console.error(error);
    }
    // let { error } = await n.save();
    //
    // if (error) {
    //   console.error(error);
    // }
  }

  // Update event status
  e.setStatus('sent');
  return e.save();
}

module.exports = {
  prepareNotification,
  sendNotification
};
