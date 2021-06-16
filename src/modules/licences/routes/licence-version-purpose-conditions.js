const Joi = require('@hapi/joi');

const { version } = require('../../../../config');

const pathPrefix = `/water/${version}/licence-version-purpose-conditions/`;
const controller = require('../controllers/licence-version-purpose-conditions');

module.exports = {
  getLicenceVersionPurposeConditions: {
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
