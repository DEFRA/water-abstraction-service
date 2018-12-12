const Boom = require('boom');
const logger = require('../../../lib/logger');

/**
 * Log error if validation fails
 */
const failAction = async (request, h, err) => {
  err.params = { path: request.path, payload: request.payload };
  err.context = { component: request.path };
  logger.error(err.message, err);
  throw Boom.badRequest(`Invalid request payload input`);
};

module.exports = {
  failAction
};
