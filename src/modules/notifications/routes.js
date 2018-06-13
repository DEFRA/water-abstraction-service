const Joi = require('joi');

const controller = require('./controller');

const routes = {

  postSend: {
    method: 'POST',
    path: '/water/1.0/notification/send',
    handler: controller.postSend,
    config: { description: 'Send notification' }
  },

  postPreview: {
    method: 'POST',
    path: '/water/1.0/notification/preview',
    handler: controller.postPreview,
    config: { description: 'Preview sending notification' }
  }
};

if (parseInt(process.env.test_mode) === 1) {
  routes.findEmailByAddress = {
    method: 'GET',
    path: '/water/1.0/notification/last',
    handler: controller.findLastEmail,
    config: {
      auth: false,
      validate: {
        query: Joi.object().keys({
          email: Joi.string().required()
        })
      }
    }
  };
}

module.exports = routes;
