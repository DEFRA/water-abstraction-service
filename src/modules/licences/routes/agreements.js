'use strict';

const Joi = require('@hapi/joi');

const controller = require('../controllers/agreements');
const preHandlers = require('../lib/pre-handlers');

const { ROLES } = require('../../../lib/roles');

const validateHeaders = async values => {
  Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
};

module.exports = {
  getAgreement: {
    method: 'GET',
    path: '/water/1.0/agreements/{agreementId}',
    handler: controller.getAgreement,
    config: {
      auth: {
        scope: [ROLES.manageAgreements]
      },
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
      auth: {
        scope: [ROLES.manageAgreements]
      },
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
      auth: {
        scope: [ROLES.deleteAgreements]
      },
      description: 'Deletes the agreement with the specified id',
      validate: {
        params: {
          agreementId: Joi.string().uuid().required()
        },
        headers: validateHeaders
      }
    }
  },

  postCreateAgreement: {
    method: 'POST',
    path: '/water/1.0/licences/{licenceId}/agreements',
    handler: controller.postLicenceAgreement,
    config: {
      auth: {
        scope: [ROLES.manageAgreements]
      },
      pre: [
        { method: preHandlers.getLicence, assign: 'licence' }
      ],
      validate: {
        params: {
          licenceId: Joi.string().uuid().required()
        },
        headers: validateHeaders,
        payload: {
          code: Joi.string().required(),
          startDate: Joi.string().isoDate().required(),
          dateSigned: Joi.string().isoDate().allow(null).default(null)
        }
      }
    }
  }
};
