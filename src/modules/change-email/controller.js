const event = require('../../lib/event');
const helpers = require('@envage/water-abstraction-helpers');
const uuid = require('uuid/v4');
const { logger } = require('./src/logger');
const notify = require('../../lib/notify');
const { findByMessageRef } = require('../notify/connectors/notify-template');

/**
 * call IDM to check authentication details, return result
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postStartEmailAddressChange = async (request, h) => {
  const { password } = request.payload;
  const { userId } = request.defra;

  return createEmailChangeRecordIDM(userId, password);
};

/**
 * call IDM to get verificationCode, call notify to send security code email
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postGenerateSecurityCode = async (request, h) => {
  const { verificationId, newEmail } = request.payload;
  try {
    const { data: { verificationCode } } = await addNewEmailAddressIDM(verificationId, newEmail);

    // Send email to new email address with security code
    const notifyTemplate = findByMessageRef('email_change_verification_code_email');
    await notify.send(notifyTemplate, { verification_code: verificationCode }, newEmail);
  } catch (error) {
    if (error.message === 'Email address already in use') {
      sendEmailAddressInUseNotification(newEmail);
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
    const { data: { newEmail } } = await verifySecurityCode(userId, securityCode);

    // Updates CRM individual entity with new email address
    await updateEmailInCRM(entityId, newEmail);

    // Create event object
    const evt = createEventObject(userName, entityId, newEmail, userId);

    // Logs event in events table with old/new email address and user ID
    await event.repo.create(evt);
  } catch (error) {
    logger.error('Email change error', error);
    if (error.name === 'EmailChangeError') return error;
  }
};

/**
 * call IDM to check user credentials and create email change record
 */
const createEmailChangeRecordIDM = (userId, password) => {
  const url = `${process.env.IDM_URI}/user/change-email-address/start`;
  return helpers.serviceRequest.post(url, { userId, password });
};

/**
 * call IDM to update record with new email address
 */
const addNewEmailAddressIDM = (verificationId, newEmail) => {
  const url = `${process.env.IDM_URI}/user/change-email-address/create-code`;
  return helpers.serviceRequest.patch(url, { verificationId, newEmail });
};

/**
 * check if record matching userId and securityCode exists
 * @param  {Int} userId
 * @param  {Int} securityCode
 */
const verifySecurityCode = (userId, securityCode) => {
  const url = `${process.env.IDM_URI}/user/change-email-address/complete`;
  return helpers.serviceRequest.post(url, { userId, securityCode });
};

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
      'old-email': userName,
      'new-email': newEmail,
      'user-id': userId
    }
  });
};

/**
 * update CRM db row for entity with new email for entity_nm
 */
const updateEmailInCRM = async (entityId, newEmail) => {
  return helpers.serviceRequest.patch(`${process.env.CRM_URI}/entity/${entityId}/entity`,
    { entity_id: entityId, entity_nm: newEmail });
};

const sendEmailAddressInUseNotification = recipient => {
  const personalisation = {
    link: `${process.env.BASE_URL}/welcome`,
    resetLink: `${process.env.BASE_URL}/reset_password` };

  const notifyTemplate = findByMessageRef('email_change_email_in_use_email');
  return notify.send(notifyTemplate, personalisation, recipient);
};

module.exports.postStartEmailAddressChange = postStartEmailAddressChange;
module.exports.postGenerateSecurityCode = postGenerateSecurityCode;
module.exports.postChangeEmailAddress = postChangeEmailAddress;
