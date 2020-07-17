'use strict';

const Joi = require('@hapi/joi');
const controller = require('./controller');

module.exports = {
  getCompaniesHouseCompanies: {
    path: '/water/1.0/companies-house/search/companies',
    method: 'GET',
    handler: controller.getCompaniesHouseCompanies,
    config: {
      description: 'Gets a list of companies from Companies House for the specified search query',
      validate: {
        query: {
          q: Joi.string().required(),
          page: Joi.number().integer().min(1).default(1)
        }
      }
    }
  }
};
