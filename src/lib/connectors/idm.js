const Joi = require('joi')
const { throwIfError } = require('@envage/hapi-pg-rest-api')
const apiClientFactory = require('./api-client-factory')
const urlJoin = require('url-join')
const config = require('../../../config')
const factory = require('./service-version-factory')
const helpers = require('@envage/water-abstraction-helpers')
const { v4: uuid } = require('uuid')
const { partialRight } = require('../../lib/object-helpers.js')

const usersClient = apiClientFactory.create(urlJoin(config.services.idm, 'user'))
const kpiClient = apiClientFactory.create(urlJoin(config.services.idm, 'kpi'))

const validateApplication = application => Joi.assert(
  application,
  Joi.string().required().valid(...Object.values(config.idm.application))
)

/**
 * Find all users that have an external_id value in the array of ids
 */
usersClient.getUsersByExternalId = async ids => {
  if (ids.length === 0) {
    return { data: [] }
  }
  return usersClient.findMany({
    external_id: { $in: ids },
    application: config.idm.application.externalUser
  })
}

/**
 * Find a single user that has the given user name
 */
usersClient.getUserByUsername = async (userName, application) => {
  validateApplication(application)

  const { error, data } = await usersClient.findMany({
    user_name: userName,
    application
  })

  throwIfError(error)
  return data[0]
}

usersClient.findOneById = async id => {
  const { error, data } = await usersClient.findOne(id)
  throwIfError(error)
  return data
}

/**
 * Starts the email change process
 * @param  {Number} userId
 * @param  {String} email  - the new email address
 * @return {Promise}
 */
const startEmailChange = (userId, email) => {
  const url = `${config.services.idm}/user/${userId}/change-email-address`
  const options = {
    body: {
      email
    }
  }
  return helpers.serviceRequest.post(url, options)
}

/**
 * Completes the email change process with a security code
 * @param  {Number} userId
 * @param  {String} securityCode - 6 digit security code
 * @return {Promise}              [description]
 */
const verifySecurityCode = (userId, securityCode) => {
  const url = `${config.services.idm}/user/${userId}/change-email-address/code`
  const options = {
    body: {
      securityCode
    }
  }
  return helpers.serviceRequest.post(url, options)
}

/**
 * Check status of email change
 * @param  {Int} userId
 * @param  {Int} securityCode
 */
const getEmailChangeStatus = userId => {
  const url = `${config.services.idm}/user/${userId}/change-email-address`
  return helpers.serviceRequest.get(url)
}

/** Creates a new user in the IDM for the given application
 *
 * @param {String} username - The username
 * @param {String} application - The idm application (water_vml|water_admin)
 * @param {String} externalId - The CRM entity id
 * @returns {Promise} A promise that will resolve with the newly created user
 */
usersClient.createUser = async (username, application, externalId) => {
  validateApplication(application)

  const userData = {
    user_name: username,
    password: uuid(),
    reset_guid: uuid(),
    reset_required: 1,
    application,
    external_id: externalId,
    bad_logins: 0,
    reset_guid_date_created: new Date()
  }

  const { data: user, error } = await usersClient.create(userData)
  throwIfError(error)
  return user
}

const setEnabled = async (userId, application, enabled) => {
  const filter = {
    user_id: userId,
    application,
    enabled: !enabled
  }
  const { data: [user], error } = await usersClient.updateMany(filter, { enabled })
  throwIfError(error)
  return user
}

/**
 * Disables the user's IDM user account if enabled
 * @param {Number} userId - the IDM user account
 * @param {String} application - the IDM application name
 * @return {Promise<Boolean>} resolves with boolean to indicate success status
 */
usersClient.disableUser = partialRight(setEnabled, false)

/**
 * Enables the user's IDM user account if disabled
 * @param {Number} userId - the IDM user account
 * @param {String} application - the IDM application name
 * @return {Promise<Boolean>} resolves with boolean to indicate success status
 */
usersClient.enableUser = partialRight(setEnabled, true)

exports.usersClient = usersClient
exports.getServiceVersion = factory.create(config.services.crm)
exports.kpiClient = kpiClient
exports.startEmailChange = startEmailChange
exports.verifySecurityCode = verifySecurityCode
exports.getEmailChangeStatus = getEmailChangeStatus
