const Boom = require('@hapi/boom')
const { logger } = require('../../../logger')

/**
 * Log error if validation fails
 */
const failAction = async (request, h, err) => {
  const params = { path: request.path, payload: request.payload }
  logger.error(err.message, err.stack, params)
  throw Boom.badRequest('Invalid request payload input')
}

module.exports = {
  failAction
}
