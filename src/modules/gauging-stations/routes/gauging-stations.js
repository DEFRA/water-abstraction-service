'use strict';

const Joi = require('@hapi/joi');
const controller = require('../controller');

module.exports = {
  getGaugingStationConditionsById: {
    path: '/water/1.0/gauging-stations/{gaugingStationId}/licences',
    method: 'GET',
    handler: controller.getGaugingStationConditionsById,
    config: {
      tags: ['api'],
      description: 'Gets a gauging station by id',
      validate: {
        params: Joi.object({
          gaugingStationId: Joi.string().required().guid()
        })
      }
    }
  },
  getGaugingStationByRef: {
    path: '/water/1.0/gauging-stations/{ref}',
    method: 'GET',
    handler: controller.getGaugingStationByRef,
    config: {
      tags: ['api'],
      description: 'Gets a gauging station by ref',
      validate: {
        params: Joi.object({
          ref: Joi.string().required().min(2)
        })
      }
    }
  }
};
