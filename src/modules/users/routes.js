const controller = require('./controller');
const Joi = require('@hapi/joi');
const config = require('../../../config');

const getEmailRegex = () => {
  return (config.testMode)
    ? /(\.gov\.uk|gmail\.com)$/
    : /\.gov\.uk$/;
};

const VALID_PERMISSIONS_KEY = Joi.string().valid([
  'basic',
  'billing_and_data',
  'environment_officer',
  'nps',
  'nps_ar_user',
  'nps_ar_approver',
  'psc',
  'wirs'
]).required();
const VALID_USER_ID = Joi.number().integer().required();
const VALID_NEW_USER_EMAIL = Joi.string().email().lowercase().trim().regex(getEmailRegex());

module.exports = {
  getStatus: {
    method: 'GET',
    path: '/water/1.0/user/{id}/status',
    handler: controller.getStatus,
    options: {
      validate: {
        params: {
          id: VALID_USER_ID
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
          callingUserId: VALID_USER_ID,
          newUserEmail: VALID_NEW_USER_EMAIL,
          permissionsKey: VALID_PERMISSIONS_KEY
        }
      }
    }
  },

  patchUserInternal: {
    method: 'PATCH',
    path: '/water/1.0/user/internal/{userId}',
    handler: controller.patchUserInternal,
    options: {
      validate: {
        params: {
          userId: VALID_USER_ID
        },
        payload: {
          callingUserId: VALID_USER_ID,
          permissionsKey: VALID_PERMISSIONS_KEY
        }
      }
    }
  },

  deleteUserInternal: {
    method: 'DELETE',
    path: '/water/1.0/user/internal/{userId}',
    handler: controller.deleteUserInternal,
    options: {
      validate: {
        params: {
          userId: VALID_USER_ID
        },
        payload: {
          callingUserId: VALID_USER_ID
        }
      }
    }
  },

  reinstateUserInternal: {
    method: 'POST',
    path: '/water/1.0/user/internal/{userId}/reinstate',
    handler: controller.reinstateUserInternal,
    options: {
      validate: {
        params: {
          userId: VALID_USER_ID
        },
        payload: {
          callingUserId: VALID_USER_ID
        }
      }
    }
  }
};
