'use strict'

const controller = require('./controller')

module.exports = {

  getChangeReasons: {
    method: 'GET',
    path: '/water/1.0/change-reasons',
    handler: controller.getChangeReasons
  }

}
