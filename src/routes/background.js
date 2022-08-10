'use strict'

const backgroundTasksRoutes = require('../modules/background-tasks/routes')

const pkg = require('../../package.json')
const { version } = pkg

module.exports = [
  ...backgroundTasksRoutes,
  {
    method: 'GET',
    path: '/status',
    handler: () => ({ version }),
    config: { auth: false, description: 'Check service status' }
  }
]
