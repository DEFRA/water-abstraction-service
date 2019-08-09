const controller = require('./controller');
const Joi = require('@hapi/joi');
const config = require('../../../config');

const getEmailRegex = () => {
  return (config.testMode)
    ? /(\.gov\.uk|gmail\.com)$/
    : /\.gov\.uk$/;
};

module.exports = {
  getStatus: {
    method: 'GET',
    path: '/water/1.0/user/{id}/status',
    handler: controller.getStatus,
    options: {
      validate: {
        params: {
          id: Joi.number().integer().required()
        }
      }
    }
  },

  postUserInternal: {
    method: 'POST',
    path: '/water/1.0/user/internal',
    handler: controller.postUserInternal,
    options: {
      validate: {
        payload: {
          callingUserId: Joi.number().integer().required(),
          newUserEmail: Joi.string().email().lowercase().trim().regex(getEmailRegex()),
          permissionsKey: Joi.string().valid([
            'basic',
            'billing_and_data',
            'environment_officer',
            'nps',
            'nps_ar_user',
            'nps_ar_approver',
            'psc',
            'wirs'
          ]).required()
        }
      }
    }
  }
};
