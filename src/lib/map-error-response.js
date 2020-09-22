const Boom = require('@hapi/boom');
const { NotFoundError, InvalidEntityError, ConflictingDataError } = require('./errors');
const { BatchStatusError, TransactionStatusError } = require('../modules/billing/lib/errors');

// caters for error triggered in this service and 404s returned from the CRM
const isNotFoundError = err => err instanceof NotFoundError || err.statusCode === 404;

module.exports = error => {
  if (isNotFoundError(error)) {
    return Boom.notFound(error.message);
  }
  if (error instanceof BatchStatusError) {
    return Boom.forbidden(error.message);
  }
  if (error instanceof TransactionStatusError) {
    return Boom.forbidden(error.message);
  }
  if (error instanceof InvalidEntityError) {
    return Boom.badData(error.message);
  }
  if (error instanceof ConflictingDataError) {
    return Boom.conflict(error.message);
  }
  // Unexpected error
  throw error;
};
