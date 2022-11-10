'use strict'

const healthRoutes = require('../modules/health/routes')

const pkg = require('../../package.json')
const { version } = pkg

module.exports = [
  {
    method: 'GET',
    path: '/status',
    handler: () => ({ version }),
    config: { auth: false, description: 'Check service status' }
  },
  ...Object.values(healthRoutes)
]
