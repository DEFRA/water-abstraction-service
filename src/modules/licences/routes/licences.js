'use strict';

const Joi = require('joi');

const { version } = require('../../../../config');

const { ROLES } = require('../../../lib/roles');

const pathPrefix = `/water/${version}/licences/`;
const controller = require('../controllers/licences');

module.exports = {
  getLicence: {
    method: 'GET',
    path: `${pathPrefix}{licenceId}`,
    handler: controller.getLicence,
    config: {
      description: 'Gets licence by ID',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().guid().required()
        })
      }
    }
  },

  getLicenceByLicenceNumber: {
    method: 'GET',
    path: `/water/${version}/licences`,
    handler: controller.getLicenceByLicenceNumber,
    config: {
      description: 'Gets licence by licence number',
      validate: {
        query: Joi.object().keys({
          licenceNumber: Joi.string().required()
        })
      }
    }
  },

  getLicenceVersions: {
    method: 'GET',
    path: `${pathPrefix}{licenceId}/versions`,
    handler: controller.getLicenceVersions,
    config: {
      description: 'Gets the licence versions by licence ID',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().uuid().required()
        })
      }
    }
  },

  getLicenceAccountsByRefAndDate: {
    method: 'GET',
    path: `${pathPrefix}licence-accounts`,
    handler: controller.getLicenceAccountsByRefAndDate,
    config: {
      description: 'Gets the licence accounts by licence ref and a date',
      validate: {
        query: Joi.object().keys({
          documentRef: Joi.string().required(),
          date: Joi.string().required()
        })
      }
    }
  },

  getLicenceDocument: {
    method: 'GET',
    path: `${pathPrefix}{licenceId}/document`,
    handler: controller.getLicenceDocument,
    config: {
      description: 'Gets the CRM v1 document for the licence with the given ID',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().guid().required()
        }),
        query: Joi.object().keys({
          includeExpired: Joi.boolean().optional().default(true)
        })
      }
    }
  },

  getValidLicenceDocumentByDate: {
    method: 'GET',
    path: `${pathPrefix}{licenceId}/valid-documents/{date}`,
    handler: controller.getValidLicenceDocumentByDate,
    config: {
      description: 'Gets the CRM document for the given licence ID and start date',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().guid().required(),
          date: Joi.date().iso().required()
        })
      }
    }
  },

  getLicenceReturns: {
    method: 'GET',
    path: `${pathPrefix}{licenceId}/returns`,
    handler: controller.getLicenceReturns,
    config: {
      description: 'Gets paginated returns for the given licence ID',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().guid().required()
        }),
        query: Joi.object().keys({
          page: Joi.number().integer().min(1).default(1),
          perPage: Joi.number().integer().min(1).default(10)
        })
      }
    }
  },

  getLicenceNotifications: {
    method: 'GET',
    path: `${pathPrefix}{licenceId}/notifications`,
    handler: controller.getLicenceNotifications,
    config: {
      description: 'Gets paginated sent notifications for the licence',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().guid().required()
        }),
        query: Joi.object().keys({
          page: Joi.number().integer().min(1).default(1),
          perPage: Joi.number().integer().min(1).default(10)
        })
      }
    }
  },

  getLicenceConditions: {
    method: 'GET',
    path: `${pathPrefix}{licenceId}/licence-version-purpose-conditions`,
    handler: controller.getLicenceVersionPurposeConditionsByLicenceId,
    config: {
      description: 'Gets conditions associated with the licence through its licence versions',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().guid().required()
        }),
        query: Joi.object().keys({
          code: Joi.string()
        })
      }
    }
  },

  postMarkLicenceForSupplementaryBilling: {
    method: 'POST',
    path: `${pathPrefix}{licenceId}/mark-for-supplementary-billing`,
    handler: controller.postMarkLicenceForSupplementaryBilling,
    config: {
      auth: {
        scope: [ROLES.billing]
      },
      description: 'Marks the licence for supplementary billing',
      validate: {
        params: Joi.object().keys({
          licenceId: Joi.string().guid().required()
        })
      }
    }
  }
};
