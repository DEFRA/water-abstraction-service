'use strict'

/**
 * Expected data has not been found in DB or API call
 */
class NotFoundError extends Error {
  constructor (message) {
    super(message)
    this.name = 'NotFoundError'
  }
}

/**
 * An entity, model or data is not in an expected state
 */
class StateError extends Error {
  constructor (message) {
    super(message)
    this.name = 'StateError'
  }
}

/**
 * There is a database problem
 */
class DBError extends Error {
  constructor (message) {
    super(message)
    this.name = 'DBError'
  }
}

/**
 * An entity is invalid
 */
class InvalidEntityError extends Error {
  constructor (message) {
    super(message)
    this.name = 'InvalidEntityError'
  }
}

/**
 * An entity conflicts with existing data
 */
class ConflictingDataError extends Error {
  constructor (message) {
    super(message)
    this.name = 'ConflictingDataError'
  }
}

/**
 * The requester is not permitted to perform the requested action
 */
class UnauthorizedError extends Error {
  constructor (message) {
    super(message)
    this.name = 'UnauthorizedError'
  }
}

exports.NotFoundError = NotFoundError
exports.StateError = StateError
exports.DBError = DBError
exports.InvalidEntityError = InvalidEntityError
exports.ConflictingDataError = ConflictingDataError
exports.UnauthorizedError = UnauthorizedError
