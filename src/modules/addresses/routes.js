'use strict';

const Joi = require('joi');
const controller = require('./controller');

const OPTIONAL_STRING = Joi.string().allow('', null).optional();

module.exports = {
  postAddress: {
    path: '/water/1.0/addresses',
    method: 'POST',
    handler: controller.postAddress,
    config: {
      description: 'Proxy for CRM to create new address record',
      validate: {
        payload: Joi.object().keys({
          address1: OPTIONAL_STRING,
          address2: OPTIONAL_STRING,
          address3: OPTIONAL_STRING,
          address4: OPTIONAL_STRING,
          town: OPTIONAL_STRING,
          county: OPTIONAL_STRING,
          country: Joi.string().required(),
          postcode: OPTIONAL_STRING,
          isTest: Joi.boolean().optional().default(false),
          dataSource: Joi.string().valid('wrls', 'nald', 'ea-address-facade', 'companies-house').default('wrls'),
          uprn: Joi.number().integer().min(0).default(null).allow(null)
        }),
        headers: async values => {
          Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
        }
      }
    }
  }
};
