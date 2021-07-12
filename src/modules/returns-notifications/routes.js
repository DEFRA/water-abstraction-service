const Joi = require('joi');
const controller = require('./controller');

const notificationId = Joi.string().required().valid('pdf.return_form', 'pdf.return_reminder');
const payload = Joi.object().keys({
  filter: Joi.object().required(),
  issuer: Joi.string().email().required(),
  name: Joi.string().required(),
  config: Joi.object({
    rolePriority: Joi.array().items(Joi.string().valid('licence_holder', 'returns_to'))
  })
});

module.exports = {

  getReturnNotificationPreview: {
    path: '/water/1.0/returns-notifications/preview/{notificationId}',
    method: 'POST',
    handler: controller.postPreviewReturnNotification,
    config: {
      description: 'Sends a notification regarding a group of returns',
      validate: {
        params: Joi.object().keys({
          notificationId
        }),
        payload
      }
    }
  },

  postReturnNotification: {
    path: '/water/1.0/returns-notifications/send/{notificationId}',
    method: 'POST',
    handler: controller.postReturnNotification,
    config: {
      description: 'Sends a notification regarding a group of returns',
      validate: {
        params: Joi.object().keys({
          notificationId
        }),
        payload
      }
    }
  }

};
