'use strict'
const Joi = require('joi')

const controller = require('./controller')
const { isAcceptanceTestTarget } = require('../../../config')

if (isAcceptanceTestTarget) {
  exports.postSetupFromYaml = {
    method: 'POST',
    path: '/water/1.0/acceptance-tests/set-up-from-yaml/{key}',
    handler: controller.postSetupFromYaml,
    config: {
      description: 'Creates test data from specified Yaml files',
      validate: {
        params: Joi.object().keys({
          key: Joi.string().required()
        })
      }
    }
  }

  exports.postTearDown = {
    method: 'POST',
    path: '/water/1.0/acceptance-tests/tear-down',
    handler: controller.postTearDown,
    config: {
      description: 'Deletes an data created for use with acceptance tests'
    }
  }
}
