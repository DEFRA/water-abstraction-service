'use strict';

const controller = require('./controller');
module.exports = {

  getSupportedSources: {
    method: 'GET',
    path: '/water/1.0/supported-sources',
    handler: controller.getSupportedSources
  }
};
