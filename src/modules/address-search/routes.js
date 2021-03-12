'use strict';

const Joi = require('@hapi/joi');
const controller = require('./controller');

const postcodeRegex = /^(([A-Z]{1,2}[0-9][A-Z0-9]?|ASCN|STHL|TDCU|BBND|[BFS]IQQ|PCRN|TKCA) ?[0-9][A-Z]{2}|BFPO ?[0-9]{1,4}|(KY[0-9]|MSR|VG|AI)[ -]?[0-9]{4}|[A-Z]{2} ?[0-9]{2}|GE ?CX|GIR ?0A{2}|SAN ?TA1)$/;

module.exports = {
  getAddressSearch: {
    path: '/water/1.0/address-search',
    method: 'GET',
    handler: controller.getAddressSearch,
    options: {
      tags: ['api'],
      description: 'Gets a list of addresses from the EA address facade matching the supplied postcode',
      validate: {
        query: Joi.object({
          q: Joi.string().regex(postcodeRegex).required().example('SW1A 1AA')
        })
      }
    }
  }
};
