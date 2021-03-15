'use strict';

const controller = require('../controllers/return-cycles');

module.exports = {

  getReturn: {
    path: '/water/1.0/return-cycles/report',
    method: 'GET',
    handler: controller.getReturnCyclesReport,
    config: {
      description: 'Gets a report of return cycles'
    }
  }
};
