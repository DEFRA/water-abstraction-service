const enqueue = require('./enqueue')

const config = require('../../../config')

const sendNewInternalUserMessage = (recipient, changePasswordLink) => {
  return enqueue.sendEmail(recipient, 'new_internal_user_email', {
    unique_create_password_link: changePasswordLink
  })
}

/**
 * Change email address flow - send verification code to new email address
 * @param  {String} recipient        - email address
 * @param  {String} verificationCode
 * @return {<Promise>}
 */
const sendVerificationCodeEmail = (recipient, verificationCode) => {
  return enqueue.sendEmail(recipient, 'email_change_verification_code_email', {
    verification_code: verificationCode,
    link: `${config.frontEnds.viewMyLicence.baseUrl}/account/change-email/verify-new-email`
  })
}

/**
 * Change email address flow - user already exists conflict
 * @param  {String} recipient        - email address
 * @param  {String} verificationCode
 * @return {<Promise>}
 */
const sendEmailAddressInUseNotification = recipient => {
  return enqueue.sendEmail(recipient, 'email_change_email_in_use_email', {
    link: `${config.frontEnds.viewMyLicence.baseUrl}/signin`,
    resetLink: `${config.frontEnds.viewMyLicence.baseUrl}/reset_password`
  })
}

exports.sendNewInternalUserMessage = sendNewInternalUserMessage
exports.sendVerificationCodeEmail = sendVerificationCodeEmail
exports.sendEmailAddressInUseNotification = sendEmailAddressInUseNotification
