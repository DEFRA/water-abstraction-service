/**
 * Controller methods to send/preview notifications
 * @module src/modules/notifications/controller
 */
const getContactList = require('./contact-list');
const licenceLoader = require('./licence-loader');
const taskConfigLoader = require('./task-config-loader');

const nunjucks = require('nunjucks');

// nunjucks.configure({ autoescape: true });
// nunjucks.renderString('Hello {{ username }}', { username: 'James' });

async function postPreview () {

}

/**
 * @param {Object} taskConfig - an object of task config fata from the water service DB
 * @param {Object} params - user-supplied template variables
 * @param {Array} contacts - array of contacts with licence header data
 * @param {Object} licences - list of licences keyed by licence number
 */
function renderTemplates (taskConfig, params, contacts, licences) {
  return contacts.map((contact) => {
    const licenceList = contact.licences.map((licence) => {
      return licences[licence.system_external_id];
    });

    // Assemble view data for passing to Nunjucks template
    const viewContext = {
      taskConfig,
      params,
      contact,
      licences: licenceList
    };

    const output = nunjucks.renderString(taskConfig.config.content.default, viewContext);

    console.log('template:', output);

    return {
      ...viewContext,
      output
    };
  });
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
  const { filter, taskConfigId, params } = request.payload;

  try {
    // Get a list of de-duped contacts with licences
    const contacts = await getContactList(filter);

    // Load licence data from permit repo, and use NALD licence transformer
    // to transform to same format used in front-end GUI
    const licenceData = await licenceLoader(contacts);

    // Load task config data
    const taskConfig = await taskConfigLoader(taskConfigId);

    await renderTemplates(taskConfig, params, contacts, licenceData);

    // console.log(JSON.stringify(taskConfig, null, 2));

    reply(contacts);
  } catch (error) {
    console.error(error);
    reply(error);
  }
}

module.exports = {
  postPreview,
  postSend
};
