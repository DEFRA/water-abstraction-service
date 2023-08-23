'use strict'

const healthRoutes = require('../modules/health/routes')

module.exports = [
  {
    method: 'GET',
    path: '/status',
    handler: () => ({ status: 'alive' }),
    config: { auth: false, description: 'Check service status' }
  },
  ...Object.values(healthRoutes)
]
