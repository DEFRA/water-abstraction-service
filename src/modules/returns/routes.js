const Joi = require('joi');
const controller = require('./controller');

module.exports = {

  getReturn: {
    path: '/water/1.0/returns',
    method: 'GET',
    handler: controller.getReturn,
    config: {
      validate: {
        query: {
          returnId: Joi.string().required()
        }
      }
    }

  }

};
