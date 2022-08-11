'use strict'

const controller = require('./controller')

module.exports = [
  {
    method: 'GET',
    path: '/status',
    handler: controller.getStatus,
    config: { auth: false, description: 'Check background service status' }
  }
]
