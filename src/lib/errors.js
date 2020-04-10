
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

exports.NotFoundError = NotFoundError;
exports.StateError = StateError;
