const controller = require('./controller');
const { version, isProduction } = require('../../../config');

const routes = {

  postSetup: {
    method: 'POST',
    path: `/water/${version}/acceptance-tests/set-up`,
    handler: controller.postSetup,
    config: {
      description: 'Creates the required data to allow acceptance tests to run'
    }
  },

  postTearDown: {
    method: 'POST',
    path: `/water/${version}/acceptance-tests/tear-down`,
    handler: controller.postTearDown,
    config: {
      description: 'Deletes an data created for use with acceptance tests'
    }
  }
};

if (!isProduction) {
  module.exports = routes;
}
