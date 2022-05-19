const Joi = require('joi')
const controller = require('./controller')
const version = '1.0'

module.exports = {
  getUpdateLicence: {
    method: 'POST',
    path: `/water/${version}/ar/{licenceRef*}`,
    handler: controller.getUpdateLicence,
    config: {
      description: 'A webhook to update the AR analysis table for a single licence',
      validate: {
        params: Joi.object().keys({
          licenceRef: Joi.string().required()
        })
      }
    }
  }
}
