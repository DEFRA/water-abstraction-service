'use strict';

const Joi = require('@hapi/joi');

const controller = require('../controllers/agreements');

module.exports = {
  getAgreement: {
    method: 'GET',
    path: '/water/1.0/agreements/{agreementId}',
    handler: controller.getAgreement,
    config: {
      validate: {
        params: {
          agreementId: Joi.string().uuid().required()
        }
      }
    }
  },

  getAgreementsForLicence: {
    method: 'GET',
    path: '/water/1.0/licences/{licenceId}/agreements',
    handler: controller.getLicenceAgreements,
    config: {
      validate: {
        params: {
          licenceId: Joi.string().uuid().required()
        }
      }
    }
  }
};
