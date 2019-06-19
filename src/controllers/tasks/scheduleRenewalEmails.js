const { throwIfError } = require('@envage/hapi-pg-rest-api');
const { get, find } = require('lodash');

const notify = require('./lib/notify');

const documentsConnector = require('../../lib/connectors/crm/documents');
const Permit = require('../../lib/connectors/permit');

const { logger } = require('../../logger');

/**
 * Gets a CRM document header record using the permit repo licence ID
 * @param  {Number}  permitId - the permit repo licence ID
 * @return {Promise}            resolves with CRM doc header record
 */
const getDocumentByLicenceId = async permitId => {
  // Read CRM doc header to get document custom name
  const [ document ] = await documentsConnector.findAll({
    system_internal_id: permitId
  });
  return document;
};

/**
 * Formats permit repo, CRM role and CRM document data into a config object
 * which can be used to send the message via the Notify code
 * @param  {Object} licence  - loaded from permit repo
 * @param  {Object} role    - primary_user record from CRM document users call
 * @param  {Object} document - CRM document
 * @return {Object}          - config object to send message via our queue
 */
const createMessageConfig = (licence, role, document) => {
  const { entityName: recipient } = role;
  return {
    id: `${licence.licence_ref}_${licence.licence_end_dt}_${recipient}`,
    recipient,
    messageRef: 'expiry_notification_email',
    personalisation: {
      licence_no: licence.licence_ref,
      licence_name: document.document_name || ''
    },
    individualEntityId: role.entityId,
    companyEntityId: document.company_entity_id,
    licences: [licence.licence_ref]
  };
};

/**
 * Given a row of data from the permit repo, looks up the document in the CRM
 * and finds its primary user, sending them an email
 * @param  {Object}  licence - permit repo data
 * @return {Promise}         - resolves when message sent
 */
const scheduleForLicence = async licence => {
  // Get CRM doc
  const document = await getDocumentByLicenceId(licence.licence_id);

  if (!(document && document.company_entity_id)) {
    return;
  }

  // Get document users from CRM to find document user with primary_user role
  const { document_id: documentId } = document;
  const { data, error } = await documentsConnector.getDocumentUsers(documentId);
  throwIfError(error);

  const role = find(data, entity => entity.roles.includes('primary_user'));

  // If role found, enqueue message
  if (role) {
    const config = createMessageConfig(licence, role, document);
    return notify.sendMessage(config);
  }
};

/**
 * A task to schedule renewal emails to licence holders who are
 * registered with the service.
 * A view in the permit repo is queried to find licences expiring 122 days
 * from today.
 * We then look at each in the CRM to find the primary user
 * and if found, we send them an email via Notify
 * @return {Promise} [description]
 */
const scheduleRenewalEmails = async () => {
  try {
    // Get expiring permits
    const licences = await Permit.expiringLicences.findAll();

    // Attempt to schedule a message for each
    const tasks = licences.map(scheduleForLicence);
    await Promise.all(tasks);

    return { error: null };
  } catch (err) {
    const data = {
      statusCode: get(err, 'statusCode'),
      uri: get(err, 'options.uri')
    };
    logger.error('Error sending scheduled reminder letters', data);
    return { error: err.toString() };
  }
};

module.exports = {
  run: scheduleRenewalEmails
};
