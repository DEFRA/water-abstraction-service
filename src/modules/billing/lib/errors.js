const { StateError } = require('../../../lib/errors');

/**
 * The batch is not in the expected status
 */
class BatchStatusError extends StateError {
  constructor (message) {
    super(message);
    this.name = 'BatchStatusError';
  }
}

exports.BatchStatusError = BatchStatusError;
