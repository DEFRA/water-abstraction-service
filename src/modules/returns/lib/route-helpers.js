const Boom = require('boom');
const logger = require('../../../lib/logger');

/**
 * Log error if validation fails
 */
const failAction = async (request, h, err) => {
  logger.error(err.message, { path: request.path, payload: JSON.stringify(request.payload) });
  throw Boom.badRequest(`Invalid request payload input`);
};

module.exports = {
  failAction
};
