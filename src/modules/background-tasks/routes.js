'use strict'

const controller = require('./controller')

module.exports = [
  {
    method: 'GET',
    path: '/background/status',
    handler: controller.getStatus,
    config: { auth: false, description: 'Check background service status' }
  }
]
