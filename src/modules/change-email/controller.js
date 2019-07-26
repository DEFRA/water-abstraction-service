const event = require('../../lib/event');
const idm = require('../../lib/connectors/idm');
const crm = require('../../lib/connectors/crm/entities');
const { logger } = require('../../logger');
const changeEmailHelpers = require('./lib/helpers');

/**
 * call IDM to check authentication details, return result
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postStartEmailAddressChange = async (request, h) => {
  const { password, userId } = request.payload;

  const result = await idm.createEmailChangeRecord(userId, password);
  return { data: result, error: null };
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

    const result = await changeEmailHelpers.sendVerificationCodeEmail(newEmail, verificationCode);
    return { data: result, error: null };
  } catch (error) {
    if (error.message === 'Email address already in use') {
      await changeEmailHelpers.sendEmailAddressInUseNotification(newEmail);
    }
    return { data: null, error };
  }
};

/**
 * check security code, log event, send confirmation email to old email address
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postChangeEmailAddress = async (request, h) => {
  const { securityCode, entityId, userId, userName } = request.payload;

  try {
    const { data: { newEmail } } = await idm.verifySecurityCode(userId, securityCode);

    await crm.updateEntityEmail(entityId, newEmail);

    const evt = changeEmailHelpers.createEventObject(userName, entityId, newEmail, userId);

    const result = await event.repo.create(evt);
    return { data: result, error: null };
  } catch (error) {
    logger.error('Email change error', error);
    if (error.name === 'EmailChangeError') return { data: null, error };
  }
};

module.exports.postStartEmailAddressChange = postStartEmailAddressChange;
module.exports.postGenerateSecurityCode = postGenerateSecurityCode;
module.exports.postChangeEmailAddress = postChangeEmailAddress;
