const uuid = require('uuid/v4');
const scheduledNotifications = require('../../controllers/notifications');

const createNotificationBody = (recipient, messageRef, type, personalisation) => ({
  id: uuid(),
  recipient,
  message_ref: messageRef,
  message_type: type,
  personalisation: personalisation,
  send_after: new Date(),
  status: 'sending'
});

const sendMessage = (type, recipient, messageRef, personalisation = {}) => {
  const body = createNotificationBody(recipient, messageRef, type, personalisation);
  const repo = scheduledNotifications.repository;
  return repo.create(body);
};

const sendEmail = (recipient, messageRef, personalisation) =>
  sendMessage('email', recipient, messageRef, personalisation);

exports.sendMessage = sendMessage;
exports.sendEmail = sendEmail;
