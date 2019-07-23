const event = require('../../lib/event');
const idm = require('../../lib/connectors/idm');
const crm = require('../../lib/connectors/crm/entities');
const { logger } = require('../../logger');
const scheduledNotifications = require('../../controllers/notifications');
const changeEmailHelpers = require('./lib/helpers');

/**
 * call IDM to check authentication details, return result
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postStartEmailAddressChange = async (request, h) => {
  const { userId } = request.defra;
  const { password } = request.payload;

  return idm.createEmailChangeRecord(userId, password);
};

/**
 * call IDM to get verificationCode, call notify to send security code email
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postGenerateSecurityCode = async (request, h) => {
  const { verificationId, newEmail } = request.payload;
  try {
    const { data: { verificationCode } } = await idm.addNewEmailToEmailChangeRecord(verificationId, newEmail);

    const scheduledNotification = changeEmailHelpers.createNotificationData(
      'email_change_verification_code_email',
      newEmail,
      { verification_code: verificationCode });
    await scheduledNotifications.repository.create(scheduledNotification);
  } catch (error) {
    if (error.message === 'Email address already in use') {
      changeEmailHelpers.sendEmailAddressInUseNotification(newEmail);
    }
    return error;
  }
};

/**
 * check security code, log event, send confirmation email to old email address
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postChangeEmailAddress = async (request, h) => {
  const { securityCode, entityId } = request.payload;
  const { userId, userName } = request.defra;

  try {
    const { data: { newEmail } } = await idm.verifySecurityCode(userId, securityCode);

    await crm.updateEntityEmail(entityId, newEmail);

    const evt = changeEmailHelpers.createEventObject(userName, entityId, newEmail, userId);

    await event.repo.create(evt);
  } catch (error) {
    logger.error('Email change error', error);
    if (error.name === 'EmailChangeError') return error;
  }
};

module.exports.postStartEmailAddressChange = postStartEmailAddressChange;
module.exports.postGenerateSecurityCode = postGenerateSecurityCode;
module.exports.postChangeEmailAddress = postChangeEmailAddress;
