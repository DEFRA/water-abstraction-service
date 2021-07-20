'use strict';

const Joi = require('joi');
const controller = require('../controllers/controller');
const { failAction } = require('../lib/route-helpers');
const { returnSchema, headerSchema } = require('../schema');

module.exports = {

  getReturn: {
    path: '/water/1.0/returns',
    method: 'GET',
    handler: controller.getReturn,
    config: {
      description: 'Gets a single view of a return for presentation to UI layer',
      validate: {
        query: Joi.object().keys({
          returnId: Joi.string().required(),
          versionNumber: Joi.number().optional().min(1)
        })
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
        payload: Joi.object().keys(headerSchema)
      }
    }
  },

  getIncompleteReturns: {
    path: '/water/1.0/returns/incomplete',
    method: 'GET',
    handler: controller.getIncompleteReturns,
    config: {
      description: 'Gets a list of incomplete returns by licence number - supports paper forms flow',
      validate: {
        query: Joi.object().keys({
          licenceNumbers: Joi.array().single().min(1).required().items(
            Joi.string().required()
          )
        }).rename('licenceNumbers[]', 'licenceNumbers', { ignoreUndefined: true })
      }
    }
  }

};
