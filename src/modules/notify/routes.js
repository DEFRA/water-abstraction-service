const Joi = require('joi');
const controller = require('./controller');
const version = '1.0';

module.exports = {
  sendMessage: {
    method: 'POST',
    path: '/water/' + version + '/notify/{message_ref}',
    handler: controller.send,
    config: {
      description: 'Send a notify message',
      validate: {
        params: {
          message_ref: Joi.string().required()
        },
        payload: {
          id: Joi.string(),
          recipient: Joi.string().required(),
          personalisation: Joi.object().required()
        }
      }
    }
  },

  sendMessageLater: {
    method: 'POST',
    path: '/water/' + version + '/notifyLater/{message_ref}',
    handler: controller.send,
    config: {
      description: 'Send a notify message',
      validate: {
        params: {
          message_ref: Joi.string().required()
        },
        payload: {
          id: Joi.string(),
          recipient: Joi.string().required(),
          personalisation: Joi.object(),
          sendafter: Joi.date().iso()
        }
      }
    }
  }
};
