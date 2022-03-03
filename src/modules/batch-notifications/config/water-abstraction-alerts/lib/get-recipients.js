'use strict';
const { logger } = require('../../../../../logger');

const ScheduledNotification = require('../../../../../lib/models/scheduled-notification');
const crmV2Connector = require('../../../../../lib/connectors/crm-v2');
const gaugingStationConnector = require('../../../../../lib/connectors/repos/gauging-stations');
const licenceGaugingStationConnector = require('../../../../../lib/connectors/repos/licence-gauging-stations');
const lvpcConnector = require('../../../../../lib/connectors/repos/licence-version-purpose-conditions');
const scheduledNotificationService = require('../../../../../lib/services/scheduled-notifications');
const eventHelpers = require('../../../lib/event-helpers');

const addressMapper = require('../../../../../lib/mappers/address');
const contactMapper = require('../../../../../lib/mappers/contact');
const companyMapper = require('../../../../../lib/mappers/company');
const notifyMapper = require('../../../../../lib/mappers/notify');

const getRecipients = async eventData => {
  const event = eventData.ev;
  const issuer = event.issuer;

  const { linkages: linkagesGroupedByLicence, sendingAlertType } = event.metadata.options;

  let recipientCount = 0;
  const licenceNumbers = [];

  for (const linkagesGroup of linkagesGroupedByLicence) {
    for (const linkage of linkagesGroup) {
      try {
        const document = await crmV2Connector.documents.getDocumentByRefAndDate(linkage.licenceRef, new Date());
        const emailContactsArray = document.companyId && await crmV2Connector.companies.getCompanyWAAEmailContacts(document.companyId);
        const format = emailContactsArray && emailContactsArray.length > 0 ? 'email' : 'letter';

        if (format === 'email') {

        }

        const licenceHolderAddress = document.addressId && await crmV2Connector.addresses.getAddress(document.addressId);
        const licenceHolderCompany = document.companyId && await crmV2Connector.companies.getCompany(document.companyId);
        const licenceContact = document.contactId && await crmV2Connector.contacts.getContact(document.contactId);

        const gaugingStation = await gaugingStationConnector.findOneByLinkageId(linkage.licenceGaugingStationId);

        const source = gaugingStation.riverName;

        const licenceGaugingStationRecord = await licenceGaugingStationConnector.findOneById(linkage.licenceGaugingStationId);
        const condition = await lvpcConnector.findOneById(licenceGaugingStationRecord.licenceVersionPurposeConditionId);

        const conditionText = condition && condition.notes;

        const notification = new ScheduledNotification();

        notification.personalisation = {
          ...linkage,
          flow_or_level: linkage.restrictionType,
          monitoring_station_name: linkage.label,
          issuer_email_address: issuer,
          alert_type: linkage.alertType,
          threshold_value: linkage.thresholdValue,
          licence_ref: linkage.licenceRef,
          sending_alert_type: sendingAlertType,
          threshold_unit: linkage.thresholdUnit,
          source: source && source.length > 0 ? `* Source of supply: ${source}` : '',
          condition_text: conditionText && conditionText.length > 0 ? `Effect of restriction: ${conditionText}` : '',
          ...notifyMapper.mapModelsToNotifyAddress({
            company: companyMapper.pojoToModel(licenceHolderCompany),
            address: addressMapper.pojoToModel(licenceHolderAddress),
            contact: contactMapper.pojoToModel(licenceContact)
          }),
        };

        // Set the template type
        if (sendingAlertType === 'stop') {
          notification.messageRef = 'water_abstraction_alert_stop';
        } else if (sendingAlertType === 'reduce') {
          if (linkage.alertType === 'stop_or_reduce') {
            notification.messageRef = 'water_abstraction_alert_reduce_or_stop';
          } else {
            notification.messageRef = 'water_abstraction_alert_reduce';
          }
        } else if (sendingAlertType === 'warning') {
          if (linkage.alertType === 'reduce') {
            notification.messageRef = 'water_abstraction_alert_reduce_warning';
          } else if (linkage.alertType === 'stop_or_reduce') {
            notification.messageRef = 'water_abstraction_alert_reduce_or_stop_warning';
          } else if (linkage.alertType === 'stop') {
            notification.messageRef = 'water_abstraction_alert_stop_warning';
          }
        } else if (sendingAlertType === 'resume') {
          notification.messageRef = 'water_abstraction_alert_resume';
        }

        notification.messageType = format;
        notification.eventId = event.id;
        notification.licences = [linkage.licenceRef];

        if (format === 'email') {
          recipientCount = recipientCount + emailContactsArray.length;
          notification.messageRef = notification.messageRef + '_email';
          emailContactsArray.forEach(async thisContact => {
            notification.recipient = thisContact.email;

            await scheduledNotificationService.createScheduledNotification(notification);
          });

        } else {
          await scheduledNotificationService.createScheduledNotification(notification);
          recipientCount++;
        }

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
