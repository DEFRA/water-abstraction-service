const Joi = require('@hapi/joi');
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
  },

  notifyCallback: {
    method: 'POST',
    path: `/water/${version}/notify/callback`,
    handler: controller.callback,
    config: {
      description: 'Accept callback from Notify',
      validate: {
        payload: {
          id: Joi.string().required().guid(),
          reference: Joi.any(),
          to: Joi.string(),
          status: Joi.string().valid('delivered', 'permanent-failure', 'temporary-failure', 'technical-failure'),
          created_at: Joi.date().iso(),
          completed_at: Joi.date().iso(),
          sent_at: Joi.date().iso(),
          notification_type: Joi.string().valid('sms', 'email'),
          template_id: Joi.string().guid(),
          template_version: Joi.number()
        }
      }
    }
  },

  sendEmail: {
    method: 'POST',
    path: `/water/${version}/notify/email`,
    handler: controller.notifyEmailProxy,
    config: {
      description: 'proxy to send notify emails',
      validate: {
        payload: Joi.object({
          templateId: Joi.string().required().guid(),
          recipient: Joi.string().email().required(),
          personalisation: Joi.object().required()
        })
      }
    }
  }
};
