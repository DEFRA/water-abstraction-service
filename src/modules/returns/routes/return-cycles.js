'use strict'

const Joi = require('joi')
const controller = require('../controllers/return-cycles')
const preHandlers = require('../pre-handlers')

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
        params: Joi.object().keys({
          returnCycleId: Joi.string().guid().required()
        })
      },
      pre: [{
        method: preHandlers.getReturnCycle,
        assign: 'returnCycle'
      }]
    }
  },

  getReturnCycleReturns: {
    path: '/water/1.0/return-cycles/{returnCycleId}/returns',
    method: 'GET',
    handler: controller.getReturnCycleReturns,
    config: {
      tags: ['api'],
      description: 'Gets returns for the specified return cycle',
      validate: {
        params: Joi.object().keys({
          returnCycleId: Joi.string().guid().required()
        })
      },
      pre: [{
        method: preHandlers.getReturnCycle,
        assign: 'returnCycle'
      }]
    }
  }
}
