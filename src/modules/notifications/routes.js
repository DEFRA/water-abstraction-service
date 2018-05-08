const controller = require('./controller');

module.exports = {

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
