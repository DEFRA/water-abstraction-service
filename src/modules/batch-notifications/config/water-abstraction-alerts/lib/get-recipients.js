'use strict';

const ScheduledNotification = require('../../../../../lib/models/scheduled-notification');
const crmV2Connector = require('../../../../../lib/connectors/crm-v2');
const scheduledNotificationService = require('../../../../../lib/services/scheduled-notifications');
const eventHelpers = require('../../../lib/event-helpers');
const sendBatch = require('../../../lib/send-batch');

const addressMapper = require('../../../../../lib/mappers/address');
const contactMapper = require('../../../../../lib/mappers/contact');
const companyMapper = require('../../../../../lib/mappers/company');
const notifyMapper = require('../../../../../lib/mappers/notify');

const getRecipients = async (eventData) => {
  // the event data was written to the events table by the
  // createEvent function of the config object. Therefore the
  // data that was included in the post body is found at
  // eventData.ev.metadata.options and will have the shape:
  // {
  //   forms: [
  //     {
  //       company: {},
  //       address: {},
  //       contact: {},
  //       returns: [{ returnId: "" }]
  //     }
  //   ]
  // }
  //
  // so for each of the returns a scheduled notification is created
  // containing the personalisation object that will allow the form
  // to be rendered.
  const event = eventData.ev;
  console.log(event);
  const { linkages: linkagesGroupedByLicence } = event.metadata.options;

  let recipientCount = 0;
  const licenceNumbers = [];

  for (const linkagesGroup of linkagesGroupedByLicence) {
    for (const linkage of linkagesGroup) {
      // For now, we will only ever send letters because we haven't yet built the Email management part of WAA.
      // This should be changed as part of implementing WATER-3192
      console.log(linkage);

      const document = await crmV2Connector.documents.getDocumentByRefAndDate(linkage.licenceRef, new Date());
      console.log(document);
      const documentRole = await crmV2Connector.documents.getDocumentRole(document.roleId);

      console.log(documentRole);
      const emailContactsArray = [];

      const licenceHolderAddress = {};

      const licenceHolderCompany = {};

      const licenceContact = {};

      const format = emailContactsArray.length > 0 ? 'email' : 'letter';
      const messageRefPrefix = format === 'letter' ? 'pdf' : format;

      const notification = new ScheduledNotification();
      notification.personalisation = {
        ...notifyMapper.mapModelsToNotifyAddress({
          company: companyMapper.pojoToModel(licenceHolderCompany),
          address: addressMapper.pojoToModel(licenceHolderAddress),
          contact: contactMapper.pojoToModel(licenceContact)
        })
      };
      notification.messageRef = `${messageRefPrefix}.water_abstraction_alert`;
      notification.messageType = format;
      notification.eventId = event.id;
      notification.licences = [linkage.licence_ref];

      await scheduledNotificationService.createScheduledNotification(notification);

      recipientCount++;
      licenceNumbers.push(linkage.licence_ref);
    }
  }

  // Update event status to 'processed'
  await eventHelpers.markAsProcessed(event.id, licenceNumbers, recipientCount);

  // Send immediately without user confirmation
  await sendBatch.send(event.id, event.issuer);
};

exports.getRecipients = getRecipients;
