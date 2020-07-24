'use strict';

/**
 * Expected data has not been found in DB or API call
 */
class NotFoundError extends Error {
  constructor (message) {
    super(message);
    this.name = 'NotFoundError';
  }
}

/**
 * An entity, model or data is not in an expected state
 */
class StateError extends Error {
  constructor (message) {
    super(message);
    this.name = 'StateError';
  }
}

/**
 * There is a database problem
 */
class DBError extends Error {
  constructor (message) {
    super(message);
    this.name = 'DBError';
  }
}

/**
 * An entity is invalid
 */
class InvalidEntityError extends Error {
  constructor (message) {
    super(message);
    this.name = 'InvalidEntityError';
  }
}

exports.NotFoundError = NotFoundError;
exports.StateError = StateError;
exports.DBError = DBError;
exports.InvalidEntityError = InvalidEntityError;
