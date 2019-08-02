const enqueue = require('./enqueue');

const sendNewInternalUserMessage = (recipient, changePasswordLink) => {
  return enqueue.sendEmail(recipient, 'new_internal_user_email', {
    unique_create_password_link: changePasswordLink
  });
};

exports.sendNewInternalUserMessage = sendNewInternalUserMessage;
