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
  return h.response({ data: result, error: null }).code(200);
};

/**
 * call IDM to get verificationCode, call notify to send security code email
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postGenerateSecurityCode = async (request, h) => {
  const { verificationId, newEmail } = request.payload;
  try {
    const { error, data: { verificationCode } } = await idm.addNewEmailToEmailChangeRecord(verificationId, newEmail);
    if (error) throw error;

    const result = await changeEmailHelpers.sendVerificationCodeEmail(newEmail, verificationCode);
    return { data: result, error: null };
  } catch (error) {
    if (error.message === 'Email address already in use') {
      await changeEmailHelpers.sendEmailAddressInUseNotification(newEmail);
    }
    return h.response({ data: null, error }).code(error.statusCode);
  }
};

/**
 * check security code, log event, send confirmation email to old email address
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postChangeEmailAddress = async (request, h) => {
  const { verificationCode, entityId, userId, userName } = request.payload;

  try {
    const { data: { newEmail } } = await idm.verifySecurityCode(userId, verificationCode);

    await crm.updateEntityEmail(entityId, newEmail);

    const evt = changeEmailHelpers.createEventObject(userName, entityId, newEmail, userId);

    const result = await event.repo.create(evt);
    return { data: result, error: null };
  } catch (error) {
    logger.error('Email change error', error);
    if (error.name === 'EmailChangeError') return h.response({ data: null, error }).code(error.statusCode);
  }
};

module.exports.postStartEmailAddressChange = postStartEmailAddressChange;
module.exports.postGenerateSecurityCode = postGenerateSecurityCode;
module.exports.postChangeEmailAddress = postChangeEmailAddress;
