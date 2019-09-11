const Joi = require('@hapi/joi');
const controller = require('./controller');
const { version } = require('../../../config');

module.exports = {
  patchUnlinkLicence: {
    method: 'PATCH',
    path: `/water/${version}/documents/{documentId}/unlink-licence`,
    handler: controller.patchUnlinkLicence,
    config: {
      description: 'Unlinks the licence from user account',
      validate: {
        params: {
          documentId: Joi.string().guid()
        },
        payload: {
          callingUserId: Joi.number().integer().required()
        }
      }
    }
  }

};
