const event = require('../../lib/event')
const idm = require('../../lib/connectors/idm')
const crmEntities = require('../../lib/connectors/crm/entities')
const changeEmailHelpers = require('./lib/helpers')
const { get } = require('lodash')

const notifications = require('../../lib/notifications/emails')

const errorCodes = {
  401: 'unauthorized',
  404: 'not-found',
  409: 'conflict',
  423: 'locked',
  429: 'rate-limit'
}

/**
 * Unless error is 500 or above, respond with 200 code and put the IDM
 * error code in the response
 * @param  {Object} error - StatusCodeError from IDM request
 * @param  {Object} h     - HAPI response toolkit
 * @param {Object}        - HAPI response
 */
const errorHandler = (error, h) => {
  const statusCode = get(error, 'statusCode')
  if (statusCode in errorCodes) {
    return h.response({
      data: null,
      error: errorCodes[statusCode]
    }).code(statusCode)
  }
  throw error
}

const getStatus = async (request, h) => {
  const { userId } = request.params
  try {
    const response = await idm.getEmailChangeStatus(userId)
    return response
  } catch (err) {
    return errorHandler(err, h)
  }
}

/**
 * call IDM to get verificationCode, call notify to send security code email
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postStartEmailAddressChange = async (request, h) => {
  const { userId } = request.params
  const { email } = request.payload
  try {
    const response = await idm.startEmailChange(userId, email)

    const securityCode = get(response, 'data.securityCode')

    // Send verification code to existing user
    await notifications.sendVerificationCodeEmail(email, securityCode)

    // Return IDM response
    return response
  } catch (err) {
    // If the error code is a conflict, send the email address in use email
    // and respond without error
    if (err.statusCode === 409) {
      await notifications.sendEmailAddressInUseNotification(email)
    }
    return errorHandler(err, h)
  }
}

/**
 * check security code, log event, send confirmation email to old email address
 * @param  {Object}  request
 * @param  {Object}  h
 */
const postSecurityCode = async (request, h) => {
  const { userId } = request.params
  const { securityCode } = request.payload

  try {
    // Get CRM entity ID and current email address from IDM
    const data = await idm.usersClient.findOneById(userId)
    const { user_name: oldEmail, external_id: entityId } = data

    const { data: { email: newEmail } } = await idm.verifySecurityCode(userId, securityCode)

    await crmEntities.updateEntityEmail(entityId, newEmail)

    const evt = changeEmailHelpers.createEventObject(oldEmail, entityId, newEmail, userId)
    await event.save(evt)

    // const result = await event.repo.create(evt);
    return { data: evt, error: null }
  } catch (err) {
    return errorHandler(err, h)
  }
}

module.exports.postStartEmailAddressChange = postStartEmailAddressChange
module.exports.postSecurityCode = postSecurityCode
module.exports.getStatus = getStatus
