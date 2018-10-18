const Boom = require('boom');
const Joi = require('joi');
const controller = require('./controller');
const { returnSchema } = require('./schema');

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
        failAction: async (request, h, err) => {
          console.error('ValidationError:', err.message); // Better to use an actual logger here.
          throw Boom.badRequest(`Invalid request payload input`);
        },
        payload: returnSchema
      }
    }
  }
};
