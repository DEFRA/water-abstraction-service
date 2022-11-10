'use strict'

const controller = require('./controller')

module.exports = {
  getInfo: {
    method: 'GET',
    path: '/health/info',
    handler: controller.getInfo,
    config: {
      auth: false
    }
  }
}
