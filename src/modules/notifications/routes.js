'use strict';

const Joi = require('@hapi/joi');
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
  },

  getNotifications: {
    method: 'GET',
    path: '/water/1.0/notifications',
    handler: controller.getNotifications,
    options: {
      tags: ['api'],
      description: 'Gets a list of sent notifications',
      validate: {
        query: {
          page: Joi.number().integer().min(1).default(1).example(5)
        }
      }
    }
  }

};
