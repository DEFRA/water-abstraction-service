const getContactList = require('./contact-list');
const licenceLoader = require('./licence-loader');
const taskConfigLoader = require('./task-config-loader');
const templateRenderer = require('./template-renderer');

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
 * @param {Number} taskConfigId - the numeric ID of the notification task
 * @param {Object} params - template parameters
 * @return {Promise} resolves with array of contacts, licences, and rendered messages to send via Notify
 */
async function prepareNotification (filter, taskConfigId, params) {
  // Get a list of de-duped contacts with licences
  const contacts = await getContactList(filter);

  // Load licence data from permit repo, and use NALD licence transformer
  // to transform to same format used in front-end GUI
  const licenceData = await licenceLoader(contacts);

  // Load task config data
  const taskConfig = await taskConfigLoader(taskConfigId);

  return templateRenderer(taskConfig, params, contacts, licenceData);
}

module.exports = {
  prepareNotification
};
