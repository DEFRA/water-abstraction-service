'use strict';

const Joi = require('joi');
const controller = require('./controller');

const exampleGuid = '00000000-0000-0000-0000-000000000000';
const preHandlers = require('./pre-handlers');

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
        query: Joi.object().keys({
          page: Joi.number().integer().min(1).default(1),
          filter: [Joi.object().optional(), Joi.string().allow('')],
          sentBy: Joi.string().allow('')
        })
      }
    }
  },

  getNotification: {
    method: 'GET',
    path: '/water/1.0/notifications/{eventId}',
    handler: controller.getNotification,
    options: {
      tags: ['api'],
      description: 'Gets a single notification including its messages',
      validate: {
        params: Joi.object().keys({
          eventId: Joi.string().guid().required().example(exampleGuid)
        })
      },
      pre: [{
        method: preHandlers.getEvent, assign: 'event'
      }]
    }
  },

  getNotificationMessage: {
    method: 'GET',
    path: '/water/1.0/notifications/{id}/message',
    handler: controller.getNotificationMessage,
    options: {
      tags: ['api'],
      description: 'Gets the message for a specific notification',
      validate: {
        params: Joi.object().keys({
          id: Joi.string().guid().required().example(exampleGuid)
        })
      }
    }
  },

  getNotificationMessages: {
    method: 'GET',
    path: '/water/1.0/notifications/{eventId}/messages',
    handler: controller.getNotificationMessages,
    options: {
      tags: ['api'],
      description: 'Gets the messages for a notification',
      validate: {
        params: Joi.object().keys({
          eventId: Joi.string().guid().required().example(exampleGuid)
        })
      },
      pre: [{
        method: preHandlers.getEvent, assign: 'event'
      }]
    }
  }

};
