const controller = require('./controller');
const Joi = require('joi');

module.exports = {
  postStartEmailAddressChange: {
    method: 'POST',
    path: '/water/1.0/change-email-address/start',
    handler: controller.postStartEmailAddressChange,
    options: {
      validate: {
        payload: {
          password: Joi.string().required(),
          userId: Joi.number().integer().required()
        }
      }
    }
  },
  postGenerateSecurityCode: {
    method: 'POST',
    path: '/water/1.0/change-email-address/verify',
    handler: controller.postGenerateSecurityCode,
    options: {
      validate: {
        payload: {
          verificationId: Joi.string().guid().required(),
          newEmail: Joi.string().email().required()
        }
      }
    }
  },
  postChangeEmailAddress: {
    method: 'POST',
    path: '/water/1.0/change-email-address/complete',
    handler: controller.postChangeEmailAddress,
    options: {
      validate: {
        payload: {
          securityCode: Joi.number().integer().required(),
          entityId: Joi.string().guid().required(),
          userId: Joi.number().integer().required(),
          userName: Joi.string().email().required()
        }
      }
    }
  }
};
