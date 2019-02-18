const { logger } = require('@envage/water-abstraction-helpers');

/**
 * Compose and send a single message with notify
 * @param {Object} contactData
 * @param {Object} taskConfig
 * @param {Object} event
 * @return {Object} ScheduledNotification instance
 */
async function notificationFactory (contactData, taskConfig, event) {
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
    heading: taskConfig.config.subject,
    subject: taskConfig.config.subject,
    ...address,
    postcode
  };

  // Get data for logging
  const licenceNumbers = contactData.contact.licences.map(row => row.system_external_id);
  const companyEntityId = contactData.contact.licences.reduce((acc, licence) => {
    return acc || licence.company_entity_id;
  }, null);

  try {
    const options = {
      messageRef: contactData.contact.method === 'email' ? 'notification_email' : 'notification_letter',
      recipient: contactData.contact.contact.email || 'n/a',
      personalisation,
      licences: licenceNumbers,
      individualEntityId: entity_id,
      companyEntityId,
      eventId: event.getId()
    };

    return options;
  } catch (error) {
    logger.error('Notification Factory error', error);
    return { error };
  }
}

module.exports = notificationFactory;
