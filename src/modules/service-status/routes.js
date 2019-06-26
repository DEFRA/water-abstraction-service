const controller = require('./controller');

module.exports = {
  getStation: {
    method: 'GET',
    path: '/water/1.0/service-status',
    handler: controller.getStatus,
    config: {
      auth: false
    }
  }
};
