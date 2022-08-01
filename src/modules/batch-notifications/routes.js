const Joi = require('joi')

const { version } = require('../../../config')
const controller = require('./controller')

// Get a list of allowed message types from config
const config = require('./config')
const messageTypes = config.map(row => row.messageType)

module.exports = {
  getByEventId: {
    method: 'GET',
    path: `/water/${version}/batch-notifications`,
    handler: controller.getByEventId,
    config: {
      validate: {
        query: Joi.object().keys({
          eventId: Joi.string().guid()
        })
      }
    }
  },

  postPrepare: {
    method: 'POST',
    path: `/water/${version}/batch-notifications/prepare/{messageType}`,
    handler: controller.postPrepare,
    config: {
      description: 'Prepares a batch message for sending by getting recipients',
      validate: {
        params: Joi.object().keys({
          messageType: Joi.string().valid(...messageTypes)
        }),
        payload: Joi.object().keys({
          issuer: Joi.string().email().required(),
          data: Joi.object().default({})
        })
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
        params: Joi.object().keys({
          eventId: Joi.string().guid().required()
        }),
        payload: Joi.object().keys({
          issuer: Joi.string().email().required()
        })
      }
    }
  }
}
