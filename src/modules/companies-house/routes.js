'use strict';

const Joi = require('@hapi/joi');
const controller = require('./controller');

const headers = Joi.object({
  authorization: Joi.string().required().example('Bearer {{JWT_TOKEN}}')
}).unknown(true);

module.exports = {
  getCompaniesHouseCompanies: {
    path: '/water/1.0/companies-house/search/companies',
    method: 'GET',
    handler: controller.getCompaniesHouseCompanies,
    config: {
      description: 'Gets a list of companies from Companies House for the specified search query',
      tags: ['api'],
      validate: {
        query: {
          q: Joi.string().required().example('Big Supply Co'),
          page: Joi.number().integer().min(1).default(1).example(1)
        },
        headers
      }
    }
  },

  getCompaniesHouseCompany: {
    path: '/water/1.0/companies-house/companies/{companyNumber}',
    method: 'GET',
    handler: controller.getCompaniesHouseCompany,
    config: {
      tags: ['api'],
      description: 'Gets a Companies House company',
      validate: {
        params: {
          companyNumber: Joi.string().required().example('01234')
        },
        headers
      }
    }
  }
};
