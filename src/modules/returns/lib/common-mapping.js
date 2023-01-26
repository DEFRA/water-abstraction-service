'use strict'

/**
 * Gets a basic shape for the return
 * @return {Object} [description]
 */
const getReturnSkeleton = () => ({
  isUnderQuery: false,
  versionNumber: 1,
  isCurrent: true,
  status: 'completed'
})

/**
 * Gets the user type from an IDM user row
 * @param  {Object} user - IDM user row
 * @return {String} user type - internal|external
 */
const getUserType = user => {
  const scopes = user.role.scopes ? user.role.scopes : []
  return scopes.includes('external') ? 'external' : 'internal'
}

/**
 * Maps IDM user to the shape in the water service return model
 * @param  {Object} user - IDM user row
 * @return {Object} water service return model user
 */
const mapUser = user => ({
  email: user.user_name,
  type: getUserType(user),
  entityId: user.external_id
})

exports.getReturnSkeleton = getReturnSkeleton
exports.mapUser = mapUser
