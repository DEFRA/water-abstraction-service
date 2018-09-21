const Joi = require('joi');
const controller = require('./controller');

module.exports = {

  postReturnNotification: {
    path: '/water/1.0/returns-notifications/{notificationId}',
    method: 'POST',
    handler: controller.postReturnNotification,
    config: {
      description: 'Sends a notification regarding a group of returns',
      validate: {
        params: {
          notificationId: Joi.string().required()
        },
        payload: {
          filter: Joi.object().required(),
          issuer: Joi.string().email().required(),
          name: Joi.string().required()
        }
      }
    }
  }

};
