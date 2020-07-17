const Joi = require('@hapi/joi');
const controller = require('./controller');
const { statuses } = require('../returns/schema');

module.exports = {
  getReturns: {
    path: '/water/1.0/company/{entityId}/returns',
    method: 'GET',
    handler: controller.getReturns,
    config: {
      description: 'Gets a list of returns for the specified company',
      validate: {
        params: {
          entityId: Joi.string().guid().required()
        },
        query: {
          startDate: Joi.string().isoDate(),
          endDate: Joi.string().isoDate(),
          isSummer: Joi.boolean(),
          status: Joi.string().valid(statuses),
          excludeNaldReturns: Joi.boolean().default(true)
        }
      }
    }
  },

  getCompanyContacts: {
    path: '/water/1.0/companies/{companyId}/contacts',
    method: 'GET',
    handler: controller.getCompanyContacts,
    config: {
      description: 'Gets the CompanyContact entities for the company',
      validate: {
        params: {
          companyId: Joi.string().uuid().required()
        }
      }
    }
  }
};
