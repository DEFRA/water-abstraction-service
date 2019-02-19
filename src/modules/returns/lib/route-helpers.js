const Boom = require('boom');
const { logger } = require('@envage/water-abstraction-helpers');

/**
 * Log error if validation fails
 */
const failAction = async (request, h, err) => {
  const params = { path: request.path, payload: request.payload };
  logger.error(err.message, err, params);
  throw Boom.badRequest(`Invalid request payload input`);
};

module.exports = {
  failAction
};
