'use strict';

const Joi = require('@hapi/joi');
const controller = require('../controllers/returns');

module.exports = {

  getReturnById: {
    path: '/water/1.0/returns/{returnId*}',
    method: 'GET',
    handler: controller.getReturnById,
    config: {
      description: 'Gets a single return service model',
      validate: {
        params: Joi.object({
          returnId: Joi.string().required()
        })
      }
    }
  }
};
