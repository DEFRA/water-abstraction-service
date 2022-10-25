const controller = require('./controller')

module.exports = {
  getStatus: {
    method: 'GET',
    path: '/health/status',
    handler: controller.getStatus,
    config: {
      auth: false
    }
  }
}
