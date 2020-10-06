'use strict';

const controller = require('../controllers/charge-versions');
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
  },

  postCreateFromWorkflow: {
    method: 'POST',
    path: '/water/1.0/charge-versions/create-from-workflow/{chargeVersionWorkflowId}',
    handler: controller.postCreateFromWorkflow,
    options: {
      validate: {
        params: {
          chargeVersionWorkflowId: VALID_GUID
        }
      }
    }
  }
};
