'use strict';

const Joi = require('@hapi/joi');

const { version } = require('../../../../config');

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
        params: {
          licenceId: Joi.string().guid().required()
        }
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
        params: {
          licenceId: Joi.string().uuid().required()
        }
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
        query: {
          documentRef: Joi.string().required(),
          date: Joi.string().required()
        }
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
        params: Joi.object({
          licenceId: Joi.string().guid().required()
        }),
        query: Joi.object({
          includeExpired: Joi.boolean().optional().default(false)
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
        params: {
          licenceId: Joi.string().guid().required(),
          date: Joi.date().iso().required()
        }
      }
    }
  }
};
