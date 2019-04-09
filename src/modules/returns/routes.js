const Joi = require('joi');
const controller = require('./controller');
const { set } = require('lodash');
const { failAction } = require('./lib/route-helpers');
const { returnSchema, headerSchema } = require('./schema');
const pre = require('./pre-handlers');

const getSubmitConfig = (isSingleReturn) => {
  const submitConfig = {
    pre: [
      { method: pre.preLoadEvent },
      { method: pre.preLoadJson },
      { method: pre.preCheckIssuer }
    ],
    validate: {
      params: {
        eventId: Joi.string().uuid().required()
      },
      query: {
        entityId: Joi.string().uuid().required(),
        companyId: Joi.string().uuid().required(),
        userName: Joi.string().email().required()
      }
    }
  };

  if (isSingleReturn) {
    set(submitConfig, 'validate.params.returnId', Joi.string().required());
  }
  return submitConfig;
};

module.exports = {

  getReturn: {
    path: '/water/1.0/returns',
    method: 'GET',
    handler: controller.getReturn,
    config: {
      description: 'Gets a single view of a return for presentation to UI layer',
      validate: {
        query: {
          returnId: Joi.string().required(),
          versionNumber: Joi.number().optional().min(1)
        }
      }
    }

  },

  postReturn: {
    path: '/water/1.0/returns',
    method: 'POST',
    handler: controller.postReturn,
    config: {
      description: 'Accepts posted return data from UI layer',
      validate: {
        failAction,
        payload: returnSchema
      }
    }
  },

  patchReturnHeader: {
    path: '/water/1.0/returns/header',
    method: 'PATCH',
    handler: controller.patchReturnHeader,
    config: {
      description: 'Updates return row data, e.g. received date, under query',
      validate: {
        failAction,
        payload: headerSchema
      }
    }
  },

  postUploadReturnsXml: {
    path: '/water/1.0/returns/upload-xml',
    method: 'POST',
    handler: controller.postUploadXml,
    config: {
      payload: {
        maxBytes: 1000 * 1000 * 50
      },
      validate: {
        payload: {
          fileData: Joi.binary().required(),
          userName: Joi.string().email().required()
        }
      }
    }
  },

  getUploadPreview: {
    path: '/water/1.0/returns/upload-preview/{eventId}',
    method: 'GET',
    handler: controller.getUploadPreview,
    config: getSubmitConfig()
  },

  getUploadPreviewSingleReturn: {
    path: '/water/1.0/returns/upload-preview/{eventId}/{returnId*}',
    method: 'GET',
    handler: controller.getUploadPreviewReturn,
    config: getSubmitConfig(true)
  },

  postUploadSubmit: {
    path: '/water/1.0/returns/upload-submit/{eventId}',
    method: 'POST',
    handler: controller.postUploadSubmit,
    config: getSubmitConfig()
  }
};
