'use strict';
const { logger } = require('../../../../../logger');

const ScheduledNotification = require('../../../../../lib/models/scheduled-notification');
const crmV2Connector = require('../../../../../lib/connectors/crm-v2');
const scheduledNotificationService = require('../../../../../lib/services/scheduled-notifications');
const eventHelpers = require('../../../lib/event-helpers');

const addressMapper = require('../../../../../lib/mappers/address');
const contactMapper = require('../../../../../lib/mappers/contact');
const companyMapper = require('../../../../../lib/mappers/company');
const notifyMapper = require('../../../../../lib/mappers/notify');

const getRecipients = async (eventData) => {
  const event = eventData.ev;

  const { linkages: linkagesGroupedByLicence } = event.metadata.options;

  let recipientCount = 0;
  const licenceNumbers = [];

  for (const linkagesGroup of linkagesGroupedByLicence) {
    for (const linkage of linkagesGroup) {
      try {
        const document = await crmV2Connector.documents.getDocumentByRefAndDate(linkage.licenceRef, new Date());
        // For now, we will only ever send letters because we haven't yet built the Email management part of WAA.
        // This should be changed as part of implementing WATER-3192
        const emailContactsArray = [];

        const licenceHolderAddress = document.addressId && await crmV2Connector.addresses.getAddress(document.addressId);
        const licenceHolderCompany = document.companyId && await crmV2Connector.companies.getCompany(document.companyId);
        const licenceContact = document.contactId && await crmV2Connector.contacts.getContact(document.contactId);

        const format = emailContactsArray.length > 0 ? 'email' : 'letter';
        const messageRefPrefix = format === 'letter' ? 'pdf' : format;

        const notification = new ScheduledNotification();
        notification.personalisation = {
          ...linkage,
          ...notifyMapper.mapModelsToNotifyAddress({
            company: companyMapper.pojoToModel(licenceHolderCompany),
            address: addressMapper.pojoToModel(licenceHolderAddress),
            contact: contactMapper.pojoToModel(licenceContact)
          })
        };

        notification.messageRef = `${messageRefPrefix}.water_abstraction_alert`;
        notification.messageType = format;
        notification.eventId = event.id;
        notification.licences = [linkage.licenceRef];

        await scheduledNotificationService.createScheduledNotification(notification);

        recipientCount++;
        licenceNumbers.push(linkage.licenceRef);
      } catch (e) {
        logger.error(e);
      }
    }
  }

  // Update event status to 'processed'
  await eventHelpers.markAsProcessed(event.id, licenceNumbers, recipientCount);
};

exports.getRecipients = getRecipients;
