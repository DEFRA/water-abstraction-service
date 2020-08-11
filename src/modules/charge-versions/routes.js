'use strict';

const controller = require('./controller');
const Joi = require('joi');

const VALID_GUID = Joi.string().guid().required();
const VALID_LICENCE_NUMBER = Joi.string().required();

module.exports = {

  getChargeVersions: {
    method: 'GET',
    path: '/water/1.0/charge-versions',
    handler: controller.getChargeVersions,
    options: {
      validate: {
        query: {
          licenceRef: VALID_LICENCE_NUMBER
        }
      }
    }
  },

  getChargeVersion: {
    method: 'GET',
    path: '/water/1.0/charge-versions/{versionId}',
    handler: controller.getChargeVersion,
    options: {
      validate: {
        params: {
          versionId: VALID_GUID
        }
      }
    }
  },

  getDocumentChargeVersions: {
    method: 'GET',
    path: '/water/1.0/charge-versions/document/{documentId}',
    handler: controller.getChargeVersionsByDocumentId,
    options: {
      validate: {
        params: {
          documentId: VALID_GUID
        }
      }
    }
  },

  getDefaultChargesForLicenceVersion: {
    method: 'GET',
    path: '/water/1.0/charge-versions/default/{licenceVersionId}',
    handler: controller.getDefaultChargesForLicenceVersion,
    options: {
      validate: {
        params: {
          licenceVersionId: VALID_GUID
        }
      }
    }
  },

  postChargeVersion: {
    method: 'POST',
    path: '/water/1.0/charge-versions',
    handler: controller.postChargeVersion,
    options: {
      validate: {
        payload: {
          licenceNumber: Joi.string().required(),
          versionNumber: Joi.number().integer().positive().required(),
          startDate: Joi.string().isoDate().required(),
          endDate: Joi.string().isoDate().allow(null).optional(),
          status: Joi.string().required(),
          apportionment: Joi.boolean().default(null).optional(),
          billedUpToDate: Joi.string().isoDate().allow(null).default(null).optional(),
          regionCode: Joi.number().integer().positive().required(),
          companyId: VALID_GUID,
          invoiceAccountId: VALID_GUID,
          scheme: Joi.string().required()
        }
      }
    }
  }
};
