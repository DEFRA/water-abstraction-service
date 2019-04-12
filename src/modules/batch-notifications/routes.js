const Joi = require('joi');

const { version } = require('../../../config');
const controller = require('./controller');

// Get a list of allowed message types from config
const config = require('./config');
const messageTypes = config.map(row => row.messageType);

module.exports = {
  postPrepare: {
    method: 'POST',
    path: `/water/${version}/batch-notifications/prepare/{messageType}`,
    handler: controller.postPrepare,
    config: {
      description: 'Prepares a batch message for sending by getting recipients',
      validate: {
        params: {
          messageType: Joi.string().allow(messageTypes)
        },
        payload: {
          issuer: Joi.string().email().required(),
          data: Joi.object().default({})
        }
      }
    }
  },

  postSend: {
    method: 'POST',
    path: `/water/${version}/batch-notifications/send/{eventId}`,
    handler: controller.postSend,
    config: {
      description: 'Sends a batch message',
      validate: {
        params: {
          eventId: Joi.string().guid().required()
        },
        payload: {
          issuer: Joi.string().email().required()
        }
      }
    }
  }
};
