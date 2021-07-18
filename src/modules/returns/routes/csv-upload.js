'use strict';

const Joi = require('joi');
const controller = require('../controllers/csv-upload');
const { set } = require('lodash');
const pre = require('../pre-handlers');

const getSubmitConfig = (isSingleReturn) => {
  const submitConfig = {
    pre: [
      { method: pre.preLoadEvent },
      { method: pre.preLoadJson },
      { method: pre.preCheckIssuer }
    ],
    validate: {
      params: Joi.object().keys({
        eventId: Joi.string().uuid().required()
      }),
      query: Joi.object().keys({
        entityId: Joi.string().uuid().required(),
        companyId: Joi.string().uuid().required(),
        userName: Joi.string().email().required()
      })
    }
  };

  if (isSingleReturn) {
    set(submitConfig, 'validate.params.returnId', Joi.string().required());
  }
  return submitConfig;
};

module.exports = {

  postUploadReturns: {
    path: '/water/1.0/returns/upload/{type}',
    method: 'POST',
    handler: controller.postUpload,
    config: {
      payload: {
        maxBytes: 1000 * 1000 * 50
      },
      validate: {
        params: Joi.object().keys({
          type: Joi.string().required().valid('xml', 'csv')
        }),
        payload: Joi.object().keys({
          fileData: Joi.binary().required(),
          userName: Joi.string().email().required(),
          companyId: Joi.string().uuid().required()
        })
      }
    }
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
