const { serviceRequest } = require('@envage/water-abstraction-helpers')
const config = require('../../../../config')

/**
 * Sets the roles and groups for a given user
 *
 * @param {String} application IDM application key (water_vml, water_admin)
 * @param {Number} userId The id of the user whose roles are being set
 * @param {Array} roles An array of role names
 * @param {Array} groups An array of groups names
 */
const setUserRoles = (application, userId, roles = [], groups = []) => {
  const url = `${config.services.idm}/user/${userId}/roles`
  const body = { application, roles, groups }
  return serviceRequest.put(url, { body })
}

/**
 * Sets the roles and groups for a given internal user
 *
 * @param {Number} userId The id of the user whose roles are being set
 * @param {Array} roles An array of role names
 * @param {Array} groups An array of groups names
 */
const setInternalUserRoles = (userId, roles, groups) =>
  setUserRoles(config.idm.application.internalUser, userId, roles, groups)

exports.setInternalUserRoles = setInternalUserRoles
