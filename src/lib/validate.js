'use strict'

const idmConnector = require('./connectors/idm')
const User = require('./models/user')

/**
 * Checks that the user is for the internal UI application
 * @param {Object} user
 * @return {Boolean}
 */
const isUserInternal = user => user.application === 'water_admin'

/**
 * Sets the current user on the current request so it is
 * available within controller actions.
 * Both a plain object and a User service model are set
 * for convenience.
 * @param {Object} request - hapi request
 * @param {Object} user
 */
const setUserOnRequest = (request, user) => {
  if (!request.defra) {
    request.defra = {}
  }

  request.defra.internalCallingUser = {
    id: user.user_id,
    email: user.user_name
  }

  request.defra.internalCallingUserModel = new User(user.user_id, user.user_name)
}

const createResponse = (isValid, data = {}) => ({
  isValid,
  ...data
})

/**
 * This is the validate() function for hapi JWT authentication
 * See: https://github.com/dwyl/hapi-auth-jwt2
 */
const validate = async (decoded, request) => {
  // To maintain compatibility with the original implementation, if an id is decoded,
  // then the token is authenticated
  if (!decoded.id) {
    return createResponse(false)
  }

  let credentials = {
    id: decoded.id,
    email: decoded.email,
    scope: decoded.roles || []
  }

  // Support loading internal user by header
  const userId = request?.headers?.['defra-internal-user-id']
  if (!decoded.email && userId) {
    // Get user from IDM and check they are internal
    const user = await idmConnector.usersClient.findOneById(userId)
    if (!user) {
      return createResponse(false, {
        errorMessage: `User ${userId} not found`
      })
    }
    if (!isUserInternal(user)) {
      return createResponse(false, {
        errorMessage: `User ${userId} not internal`
      })
    }

    credentials = {
      id: user.user_id,
      email: user.user_name,
      scope: user.roles
    }

    // For backwards-compatibility, set the user info on the request
    // This approach should be depracated in favour of using request.auth.credentials
    setUserOnRequest(request, user)
  }

  // Return either the credentials decoded from the token, or those
  // loaded via the defra-internal-user-id header
  return { isValid: true, credentials }
}

exports.validate = validate
