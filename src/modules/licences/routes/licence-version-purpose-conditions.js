const Joi = require('@hapi/joi');

const { version } = require('../../../../config');

const pathPrefix = '/water/1.0/licence-version-purpose-conditions/';
const controller = require('../controllers/licence-version-purpose-conditions');

module.exports = {
  getLicenceInvoices: {
    method: 'GET',
    path: `${pathPrefix}{licenceVersionPurposeConditionId}`,
    handler: controller.getLicenceVersionPurposeConditionById,
    config: {
      validate: {
        params: Joi.object({
          licenceVersionPurposeConditionId: Joi.string().uuid().required()
        })
      }
    }
  }
};
