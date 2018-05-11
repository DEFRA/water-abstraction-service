const ScheduledNotification = require('../../../lib/scheduled-notification');

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

    return n;
  } catch (error) {
    console.error(error);
    return { error };
  }
}

module.exports = notificationFactory;
