const Boom = require('boom');
const Joi = require('joi');
const controller = require('./controller');
const { returnSchema, headerSchema } = require('./schema');
const logger = require('../../lib/logger');

/**
 * Log error if validation fails
 */
const failAction = async (request, h, err) => {
  logger.error(err.message, { path: request.path, payload: JSON.stringify(request.payload) });
  throw Boom.badRequest(`Invalid request payload input`);
};

module.exports = {

  getReturn: {
    path: '/water/1.0/returns',
    method: 'GET',
    handler: controller.getReturn,
    config: {
      description: 'Gets a single view of a return for presentation to UI layer',
      validate: {
        query: {
          returnId: Joi.string().required(),
          versionNumber: Joi.number().optional().min(1)
        }
      }
    }

  },

  postReturn: {
    path: '/water/1.0/returns',
    method: 'POST',
    handler: controller.postReturn,
    config: {
      description: 'Accepts posted return data from UI layer',
      validate: {
        failAction,
        payload: returnSchema
      }
    }
  },

  patchReturnHeader: {
    path: '/water/1.0/returns/header',
    method: 'PATCH',
    handler: controller.patchReturnHeader,
    config: {
      description: 'Updates return row data, e.g. received date, under query',
      validate: {
        failAction,
        payload: headerSchema
      }
    }
  }
};
