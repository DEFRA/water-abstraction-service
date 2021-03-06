'use strict';
const Joi = require('@hapi/joi');

const controller = require('./controller');
const { isAcceptanceTestTarget } = require('../../../config');

if (isAcceptanceTestTarget) {
  exports.postSetup = {
    method: 'POST',
    path: '/water/1.0/acceptance-tests/set-up',
    handler: controller.postSetup,
    config: {
      description: 'Creates the required data to allow acceptance tests to run'
    }
  };

  exports.postSetupFromYaml = {
    method: 'POST',
    path: '/water/1.0/acceptance-tests/set-up-from-yaml/{key}',
    handler: controller.postSetupFromYaml,
    config: {
      description: 'Creates test data from specified Yaml files',
      validate: {
        params: {
          key: Joi.string().required()
        }
      }
    }
  };

  exports.postTearDown = {
    method: 'POST',
    path: '/water/1.0/acceptance-tests/tear-down',
    handler: controller.postTearDown,
    config: {
      description: 'Deletes an data created for use with acceptance tests'
    }
  };
}
