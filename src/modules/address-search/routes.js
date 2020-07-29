'use strict';

const Joi = require('@hapi/joi');
const controller = require('./controller');

module.exports = {
  getAddressSearch: {
    path: '/water/1.0/address-search',
    method: 'GET',
    handler: controller.getAddressSearch,
    config: {
      description: 'Gets a list of addresses from the EA address facade',
      validate: {
        query: {
          q: Joi.string().required()
        }
      }
    }
  }
};
