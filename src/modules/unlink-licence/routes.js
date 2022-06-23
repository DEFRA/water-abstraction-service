const Joi = require('joi')
const controller = require('./controller')
const { version } = require('../../../config')

module.exports = {
  patchUnlinkLicence: {
    method: 'PATCH',
    path: `/water/${version}/documents/{documentId}/unlink-licence`,
    handler: controller.patchUnlinkLicence,
    config: {
      description: 'Unlinks the licence from user account',
      validate: {
        params: Joi.object().keys({
          documentId: Joi.string().guid()
        }),
        payload: Joi.object().keys({
          callingUserId: Joi.number().integer().required()
        })
      }
    }
  }

}
