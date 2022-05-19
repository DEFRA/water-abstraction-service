const Joi = require('joi')
const controller = require('./controller')

module.exports = {
  getRenderNotification: {
    path: '/water/1.0/pdf-notifications/render/{notificationId}',
    method: 'GET',
    handler: controller.getRenderNotification,
    config: {
      description: 'Renders a notification ready for conversion to PDF',
      validate: {
        params: Joi.object().keys({
          notificationId: Joi.string().guid().required()
        })
      }
    }
  }
}
