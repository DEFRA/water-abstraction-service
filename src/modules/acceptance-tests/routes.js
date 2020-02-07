'use strict';

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

  exports.postTearDown = {
    method: 'POST',
    path: '/water/1.0/acceptance-tests/tear-down',
    handler: controller.postTearDown,
    config: {
      description: 'Deletes an data created for use with acceptance tests'
    }
  };
}
