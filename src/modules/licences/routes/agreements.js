'use strict';

const Joi = require('@hapi/joi');

const controller = require('../controllers/agreements');
const preHandlers = require('../lib/pre-handlers');

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
      pre: [
        { method: preHandlers.getLicence, assign: 'licence' }
      ],
      validate: {
        params: {
          licenceId: Joi.string().uuid().required()
        }
      }
    }
  },

  deleteAgreement: {
    method: 'DELETE',
    path: '/water/1.0/agreements/{agreementId}',
    handler: controller.deleteAgreement,
    config: {
      description: 'Deletes the agreement with the specified id',
      validate: {
        params: {
          agreementId: Joi.string().uuid().required()
        },
        headers: async values => {
          Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
        }
      }
    }
  },

  createAgreement: {
    method: 'POST',
    path: '/water/1.0/licences/{licenceId}/agreements',
    handler: controller.postLicenceAgreement,
    config: {
      pre: [
        { method: preHandlers.getLicence, assign: 'licence' }
      ],
      validate: {
        params: {
          licenceId: Joi.string().uuid().required()
        },
        payload: {
          code: Joi.string().required(),
          startDate: Joi.string().isoDate().required(),
          dateSigned: Joi.string().isoDate().allow(null).default(null)
        }
      }
    }
  }
};
