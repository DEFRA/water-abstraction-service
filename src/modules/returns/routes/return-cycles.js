'use strict';

const Joi = require('@hapi/joi');
const controller = require('../controllers/return-cycles');

module.exports = {

  getReturnCycleReport: {
    path: '/water/1.0/return-cycles/report',
    method: 'GET',
    handler: controller.getReturnCyclesReport,
    config: {
      tags: ['api'],
      description: 'Gets a report of return cycles'
    }
  },

  getReturnCycle: {
    path: '/water/1.0/return-cycles/{returnCycleId}',
    method: 'GET',
    handler: controller.getReturnCycle,
    config: {
      tags: ['api'],
      description: 'Gets a single return cycle',
      validate: {
        params: Joi.object({
          returnCycleId: Joi.string().guid().required()
        }),
        failAction: (request, h, err) => {
          console.error(err);
        }
      }
    }
  }
};
