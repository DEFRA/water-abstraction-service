'use strict'

const Joi = require('joi')

const controller = require('./controller')

exports.getApplicationState = {
  method: 'GET',
  path: '/water/1.0/application-state/{key}',
  handler: controller.getApplicationState
}

exports.postApplicationState = {
  method: 'POST',
  path: '/water/1.0/application-state/{key}',
  handler: controller.postApplicationState,
  config: {
    validate: {
      payload: Joi.object().required()
    }
  }
}
