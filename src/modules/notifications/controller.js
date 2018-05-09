/**
 * Controller methods to send/preview notifications
 * @module src/modules/notifications/controller
 */
const { prepareNotification } = require('./lib');

/**
 * @param { Object } request.payload.filter - standard filter
 * @param { Object } request.payload.params - variables that will be merged into the template *
 * @param { Number } request.payload.taskConfigId - the ID of the notification task in the task_config table *
 */
async function postPreview (request, reply) {
  const { filter, taskConfigId, params } = request.payload;

  try {
    const data = await prepareNotification(filter, taskConfigId, params);

    return reply(data);
  } catch (error) {
    console.error(error);
    reply(error);
  }
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
  return reply('Not implemented').code(501);

  // const { filter, taskConfigId, params } = request.payload;
  //
  // try {
  //   const data = await prepareNotification(filter, taskConfigId, params);
  //
  //   return reply(data);
  // } catch (error) {
  //   console.error(error);
  //   reply(error);
  // }
}

module.exports = {
  postPreview,
  postSend
};
