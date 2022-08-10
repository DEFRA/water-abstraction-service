'use strict'

const Joi = require('joi')

const controller = require('./controller')

module.exports = [
  {
    method: 'POST',
    path: '/water-bg/1.0/worker/register',
    handler: controller.postRegisterWorker,
    config: {
      validate: {
        payload: Joi.object().required()
      }
    }
  }
]
