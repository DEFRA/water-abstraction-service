const Joi = require('@hapi/joi');
const controller = require('../controllers/documents');
const { version } = require('../../../../config');
const singularPrefix = `/water/${version}/document/`;
const pathPrefix = `/water/${version}/documents/`;

module.exports = {

  getLicenceByDocumentId: {
    method: 'GET',
    path: `${pathPrefix}{documentId}/licence`,
    handler: controller.getLicenceByDocumentId,
    config: {
      description: 'Returns the current version of the licence for a given document',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        },
        query: {
          companyId: Joi.string().guid(),
          includeExpired: Joi.boolean().optional().default(false)
        }
      }
    }
  },

  getLicenceConditionsByDocumentId: {
    method: 'GET',
    path: `${pathPrefix}{documentId}/licence/conditions`,
    handler: controller.getLicenceConditionsByDocumentId,
    config: {
      description: 'Returns the conditions of the current version of the licence for a given document',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        },
        query: {
          companyId: Joi.string().guid(),
          includeExpired: Joi.boolean().optional().default(false)
        }
      }
    }
  },

  getLicencePointsByDocumentId: {
    method: 'GET',
    path: `${pathPrefix}{documentId}/licence/points`,
    handler: controller.getLicencePointsByDocumentId,
    config: {
      description: 'Returns the points of the current version of the licence for a given document',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        },
        query: {
          companyId: Joi.string().guid(),
          includeExpired: Joi.boolean().optional().default(false)
        }
      }
    }
  },

  getLicenceUsersByDocumentId: {
    method: 'GET',
    path: `${pathPrefix}{documentId}/licence/users`,
    handler: controller.getLicenceUsersByDocumentId,
    config: {
      description: 'Returns the users that are able to access the licence for a given document',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        },
        query: {
          companyId: Joi.string().guid(),
          includeExpired: Joi.boolean().optional().default(false)
        }
      }
    }
  },

  getLicenceSummaryByDocumentId: {
    method: 'GET',
    path: `${pathPrefix}{documentId}/licence/summary`,
    handler: controller.getLicenceSummaryByDocumentId,
    config: {
      description: 'Returns the licence summary details for a given document',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        },
        query: {
          companyId: Joi.string().guid(),
          includeExpired: Joi.boolean().optional().default(false)
        }
      }
    }
  },

  getLicenceCommunicationsByDocumentId: {
    method: 'GET',
    path: `${pathPrefix}{documentId}/licence/communications`,
    handler: controller.getLicenceCommunicationsByDocumentId,
    config: {
      description: 'Returns the sent licence notifications for a given document',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        },
        query: {
          includeExpired: Joi.boolean().optional().default(false),
          companyId: Joi.string().guid()
        }
      }
    }
  },

  getLicenceCompanyByDocumentId: {
    method: 'GET',
    path: `${pathPrefix}{documentId}/licence/company`,
    handler: controller.getLicenceCompanyByDocumentId,
    config: {
      description: 'Returns the company details for a given document',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        }
      }
    }
  },

  getLicenceDocumentByDocRefAndDate: {
    method: 'GET',
    path: `${singularPrefix}search`,
    handler: controller.getLicenceDocumentByDocRefAndDate,
    config: {
      description: 'Returns the document for a given document ref and a specified date, including a company identifier',
      validate: {
        query: {
          regime: Joi.string().default('water'),
          documentType: Joi.string().default('abstraction_licence'),
          documentRef: Joi.string().required(),
          date: Joi.date()
        }
      }
    }
  },

  postLicenceName: {
    method: 'POST',
    path: `${pathPrefix}{documentId}/rename`,
    handler: controller.postLicenceName,
    config: {
      description: 'Sets name for a licence',
      validate: {
        params: {
          documentId: Joi.string().guid().required()
        },
        payload: {
          documentName: Joi.string().required().allow(''),
          userName: Joi.string().email().required()
        }
      }
    }
  }
};
