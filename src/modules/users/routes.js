const controller = require('./controller');
const Joi = require('joi');

module.exports = {
  getStatus: {
    method: 'GET',
    path: '/water/1.0/user/{id}/status',
    handler: controller.getStatus,
    options: {
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      }
    }
  }
};
