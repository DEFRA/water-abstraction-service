'use strict';

const controller = require('./controller');
const Joi = require('joi');

const VALID_GUID = Joi.string().guid().required();

module.exports = {

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
  }
};
