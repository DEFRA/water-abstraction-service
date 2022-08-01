const controller = require('./controller')
const Joi = require('joi')

const SECURITY_CODE_REGEX = /^[0-9]{6}$/
const VALID_SECURITY_CODE = Joi.string().regex(SECURITY_CODE_REGEX).required()
const VALID_USER_ID = Joi.number().positive().required()
const VALID_EMAIL = Joi.string().email().required()

module.exports = {

  postGenerateSecurityCode: {
    method: 'POST',
    path: '/water/1.0/user/{userId}/change-email-address',
    handler: controller.postStartEmailAddressChange,
    options: {
      validate: {
        params: Joi.object().keys({
          userId: VALID_USER_ID
        }),
        payload: Joi.object().keys({
          email: VALID_EMAIL
        })
      }
    }
  },
  postChangeEmailAddress: {
    method: 'POST',
    path: '/water/1.0/user/{userId}/change-email-address/code',
    handler: controller.postSecurityCode,
    options: {
      validate: {
        params: Joi.object().keys({
          userId: VALID_USER_ID
        }),
        payload: Joi.object().keys({
          securityCode: VALID_SECURITY_CODE
        })
      }
    }
  },
  getStatus: {
    method: 'GET',
    path: '/water/1.0/user/{userId}/change-email-address',
    handler: controller.getStatus,
    options: {
      validate: {
        params: Joi.object().keys({
          userId: VALID_USER_ID
        })
      }
    }
  }
}
