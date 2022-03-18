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
        params: Joi.object().keys({
          versionId: VALID_GUID
        })
      }
    }
  },
  getLicenceChargeVersion: {
    method: 'GET',
    path: '/water/1.0/charge-versions/licence/{licenceId}',
    handler: controller.getChargeVersionsByLicenceId,
    options: {
      validate: {
        params: Joi.object().keys({
          licenceId: VALID_GUID
        })
      }
    }
  },
  getDocumentChargeVersions: {
    method: 'GET',
    path: '/water/1.0/charge-versions/document/{documentId}',
    handler: controller.getChargeVersionsByDocumentId,
    options: {
      validate: {
        params: Joi.object().keys({
          documentId: VALID_GUID
        })
      }
    }
  },

  getDefaultChargesForLicenceVersion: {
    method: 'GET',
    path: '/water/1.0/charge-versions/default/{licenceVersionId}',
    handler: controller.getDefaultChargesForLicenceVersion,
    options: {
      validate: {
        params: Joi.object().keys({
          licenceVersionId: VALID_GUID
        })
      }
    }
  },

  postCreateFromWorkflow: {
    method: 'POST',
    path: '/water/1.0/charge-versions/create-from-workflow/{chargeVersionWorkflowId}',
    handler: controller.postCreateFromWorkflow,
    options: {
      validate: {
        params: Joi.object().keys({
          chargeVersionWorkflowId: VALID_GUID
        })
      }
    }
  },

  postUploadChargeInformation: {
    path: '/water/1.0/charge-versions/upload/{type}',
    method: 'POST',
    handler: controller.postUpload,
    config: {
      payload: {
        maxBytes: 1000 * 1000 * 50
      },
      validate: {
        params: Joi.object().keys({
          type: Joi.string().required().valid('csv')
        }),
        payload: Joi.object().keys({
          fileData: Joi.binary().required(),
          filename: Joi.string().required(),
          userName: Joi.string().email().required()
        })
      }
    }
  },

  getUDownloadChargeInformationErrorFile: {
    path: '/water/1.0/charge-versions/download/{eventId}',
    method: 'GET',
    handler: controller.getDownloadErrorFile,
    config: {
      validate: {
        params: Joi.object().keys({
          eventId: Joi.string().guid().optional()
        })
      }
    }
  }
};
