const controller = require('../charge-versions/controllers/charge-versions')
const Joi = require('joi')

module.exports = {
  postUploadChargeInformation: {
    path: '/water/1.0/charge-versions/upload/{type}',
    method: 'POST',
    handler: controller.postUpload,
    config: {
      payload: {
        maxBytes: 1000 * 1000 * 50
      },
      validate: {
        params: Joi.object().keys({
          type: Joi.string().required().valid('csv')
        }),
        payload: Joi.object().keys({
          fileData: Joi.binary().required(),
          filename: Joi.string().required(),
          userName: Joi.string().email().required()
        })
      }
    }
  },

  getUDownloadChargeInformationErrorFile: {
    path: '/water/1.0/charge-versions/download/{eventId}',
    method: 'GET',
    handler: controller.getDownloadErrorFile,
    config: {
      validate: {
        params: Joi.object().keys({
          eventId: Joi.string().guid().optional()
        })
      }
    }
  }
}
