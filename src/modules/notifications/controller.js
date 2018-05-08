const getContactList = require('./contact-list');

async function postPreview () {

}

/**
 * Send a notification
 * The process is:
 * - select template (and personalisation variables)
 * - select audience (licence numbers)
 * - generate contact list
 * - send
 *
 * @param {Object} request.payload.filter - standard filter for selecting licences from CRM
 * @param {Object} request.payload.params - variables that will be merged into the template
 * @param {Number} request.payload.taskConfigId - the ID of the notification task in the task_config table
 *
 * The process:
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
 */
async function postSend (request, reply) {
  const { filter } = request.payload;

  try {
    const data = await getContactList(filter);

    reply(data);
  } catch (error) {
    console.error(error);
    reply(error);
  }
}

module.exports = {
  postPreview,
  postSend
};
