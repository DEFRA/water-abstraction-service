const uuid = require('uuid/v4');
const event = require('../../../lib/event');
const scheduledNotifications = require('../../../controllers/notifications');

/**
 * create event object to be inserted into event log
 */
const createEventObject = (userName, entityId, newEmail, userId) => {
  return event.create({
    event_id: uuid(),
    type: 'user-account',
    subtype: 'email-change',
    issuer: userName,
    entities: [entityId],
    metadata: {
      oldEmail: userName,
      newEmail,
      userId
    }
  });
};

/**
 * create notification object to be inserted into scheduled_notifications table
 */
const createNotificationData = (messageRef, recipient, personalisation) => {
  return {
    id: uuid(),
    recipient,
    message_type: 'email',
    message_ref: messageRef,
    personalisation
  };
};

const sendVerificationCodeEmail = (newEmail, verificationCode) => {
  const scheduledNotification = createNotificationData(
    'email_change_verification_code',
    newEmail,
    { verification_code: verificationCode });
  return scheduledNotifications.repository.create(scheduledNotification);
};
/**
 * set personalisation and send email address already in use email
 */
const sendEmailAddressInUseNotification = recipient => {
  const personalisation = {
    link: `${process.env.BASE_URL}/signin`,
    resetLink: `${process.env.BASE_URL}/reset_password` };

  const scheduledNotification = createNotificationData('email_change_email_in_use', recipient, personalisation);
  return scheduledNotifications.repository.create(scheduledNotification);
};

exports.createEventObject = createEventObject;
exports.createNotificationData = createNotificationData;
exports.sendVerificationCodeEmail = sendVerificationCodeEmail;
exports.sendEmailAddressInUseNotification = sendEmailAddressInUseNotification;
