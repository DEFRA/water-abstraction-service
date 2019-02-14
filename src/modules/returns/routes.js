const Joi = require('joi');
const controller = require('./controller');
const { failAction } = require('./lib/route-helpers');
const { returnSchema, headerSchema } = require('./schema');

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
      validate: {
        payload: {
          fileData: Joi.binary().required(),
          userName: Joi.string().email().required()
        }
      }
    }
  }
};
