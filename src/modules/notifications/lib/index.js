const getContactList = require('./contact-list');
const licenceLoader = require('./licence-loader');
const taskConfigLoader = require('./task-config-loader');
const templateRenderer = require('./template-renderer');
const eventFactory = require('./event-factory');
const ScheduledNotification = require('../../../lib/scheduled-notification');

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

/**
 * Compose and send a single message with notify
 * @param {Object} contactData
 * @param {Object} taskConfig
 * @return {Promise} resolves with { error }
 */
async function sendNotifyMessage (contactData, taskConfig, event) {
  // Format name
  const { salutation, forename, name, entity_id } = contactData.contact.contact;
  const fullName = [salutation, forename, name].filter(x => x).join(' ');

  // Get address
  const { address_1, address_2, address_3, address_4, town, county, postcode } = contactData.contact.contact;
  const lines = [fullName, address_1, address_2, address_3, address_4, town, county];

  // Format personalisation with address lines and postcode
  const address = lines.filter(x => x).reduce((acc, line, i) => {
    return {
      ...acc,
      [`address_line_${i + 1}`]: line
    };
  }, {});

  // Compose notify personalisation
  const personalisation = {
    body: contactData.output,
    heading: taskConfig.config.name,
    ...address,
    postcode
  };

  // Get data for logging
  const licenceNumbers = contactData.contact.licences.map(row => row.system_external_id);
  const companyEntityId = contactData.contact.licences.reduce((acc, licence) => {
    return acc || licence.company_entity_id;
  }, null);

  try {
    const n = new ScheduledNotification();
    await n.setMessage(contactData.contact.method === 'email' ? 'notification_email' : 'notification_letter');
    n.setPersonalisation(personalisation)
      .setRecipient(contactData.contact.email)
      .setLicenceNumbers(licenceNumbers)
      .setCompanyEntityId(companyEntityId)
      .setIndividualEntityId(entity_id)
      .setEventId(event.getId())
      .setText(contactData.output);

    return n.save();
  } catch (error) {
    console.error(error);
    return { error };
  }
}

/**
 * Send notification
 * We need to:
 * - Create batch event GUID and reference number
 * - Compose each message's Notify packet and send
 * - Log batch
 * @param {Number} taskConfigId
 * @param {String} issuer - email address
 * @param {Array} contactData - data from prepare step above
 */
async function sendNotification (taskConfigId, issuer, contactData) {
  const taskConfig = await taskConfigLoader(taskConfigId);

  // Create event
  const e = eventFactory(issuer, taskConfig, contactData);
  await e.save();

  console.log(`Sending notification reference ${e.getReference()} ID ${e.getId()}`);

  // Schedule messages for sending
  for (let row of contactData) {
    const { error } = await sendNotifyMessage(row, taskConfig, e);
    if (error) {
      console.log(error);
    }
  }

  // Update event status
  e.setStatus('sent');
  return e.save();
}

module.exports = {
  prepareNotification,
  sendNotification
};
