/**
 * Controller methods to send/preview notifications
 * @module src/modules/notifications/controller
 */
const Boom = require('boom');
const { prepareNotification, sendNotification } = require('./lib');
const taskConfigLoader = require('./lib/task-config-loader');
const generateReference = require('./lib/reference-generator');
const notificationClient = require('../../lib/connectors/notifications');

/**
 * @param { Object } request.payload.filter - standard filter
 * @param { Object } request.payload.params - variables that will be merged into the template *
 * @param { Number } request.payload.taskConfigId - the ID of the notification task in the task_config table *
 */
async function postPreview (request, reply) {
  try {
    const { filter, taskConfigId, params } = request.payload;
    const taskConfig = await taskConfigLoader(taskConfigId);
    const data = await prepareNotification(filter, taskConfig, params, { ref: 'SAMPLE' });
    return reply({ error: null, data });
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
  try {
    const { filter, taskConfigId, params, sender } = request.payload;
    const taskConfig = await taskConfigLoader(taskConfigId);
    const ref = generateReference(taskConfig.config.prefix);
    const data = await prepareNotification(filter, taskConfig, params, { ref });
    await sendNotification(taskConfig, sender, data, ref);
    return reply({ error: null, data });
  } catch (error) {
    console.error(error);
    reply(error);
  }
}

/**
 * Returns the last email message for a given email address.
 *
 * If no email for the requested address then then returns a 404.
 *
 * This function is here to facilitate acceptance tests and it
 * not currently used by the main applications. It's route is accessible
 * annonymously.
 *
 * @param {String} request.query.email - The email address to filter by,
 */
async function findLastEmail (request, reply) {
  try {
    const { email } = request.query;
    const data = await notificationClient.getLatestEmailByAddress(email);

    if (data.data.length === 0) {
      return reply(Boom.notFound(`No email found for ${email}`));
    }

    return reply({ error: null, data: data.data });
  } catch (error) {
    reply(Boom.badImplementation('Error getting last email for user', error));
  }
};

module.exports = {
  postPreview,
  postSend,
  findLastEmail
};
