const controller = require('./controller');

module.exports = {

  getStation: {
    method: 'GET',
    path: '/water/1.0/river-levels/station/{id}',
    handler: controller.getStation,
    config: {

    }
  }

};
