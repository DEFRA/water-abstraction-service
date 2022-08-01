'use strict'

const Boom = require('@hapi/boom')

const commandMap = new Map()
commandMap.set('NotFoundError', Boom.notFound)
commandMap.set('BatchStatusError', Boom.forbidden)
commandMap.set('TransactionStatusError', Boom.forbidden)
commandMap.set('InvalidEntityError', Boom.badData)
commandMap.set('ConflictingDataError', Boom.conflict)

/**
 * Maps a service error to a Boom error for providing an HTTP response
 * If the error is unknown, it is rethrown
 * @param {Error}
 * @return {Error} Boom error
 */
const mapErrorResponse = error => {
  const boomError = commandMap.get(error.name)

  if (boomError) {
    return boomError(error.message)
  }

  if (error.statusCode === 404) {
    return Boom.notFound(error.message)
  }

  throw error
}

module.exports = mapErrorResponse
