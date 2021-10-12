const Joi = require('joi');
const controller = require('./controller');
const { statuses } = require('../returns/schema');
const { ROLES: { billing } } = require('../../lib/roles');

const EXAMPLE_GUID = '00000000-0000-0000-0000-000000000000';

module.exports = {
  getReturns: {
    path: '/water/1.0/company/{entityId}/returns',
    method: 'GET',
    handler: controller.getReturns,
    config: {
      description: 'Gets a list of returns for the specified company',
      validate: {
        params: Joi.object().keys({
          entityId: Joi.string().guid().required()
        }),
        query: Joi.object().keys({
          startDate: Joi.string().isoDate(),
          endDate: Joi.string().isoDate(),
          isSummer: Joi.boolean(),
          status: Joi.string().valid(...statuses),
          excludeNaldReturns: Joi.boolean().default(true)
        })
      }
    }
  },

  getCompany: {
    path: '/water/1.0/companies/{companyId}',
    method: 'GET',
    handler: controller.getCompany,
    config: {
      description: 'Gets the company with the specified ID',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required()
        })
      }
    }
  },

  searchCompaniesByName: {
    path: '/water/1.0/companies/search',
    method: 'GET',
    handler: controller.searchCompaniesByName,
    config: {
      description: 'Soft-search companies by name',
      validate: {
        query: Joi.object().keys({
          name: Joi.string().required().min(2),
          soft: Joi.boolean().optional().default(true)
        })
      }
    }
  },

  getCompanyAddresses: {
    path: '/water/1.0/companies/{companyId}/addresses',
    method: 'GET',
    handler: controller.getCompanyAddresses,
    config: {
      description: 'Gets the addresses for the specified company',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required()
        })
      }
    }
  },

  createCompanyInvoiceAccount: {
    path: '/water/1.0/companies/{companyId}/invoice-accounts',
    method: 'POST',
    handler: controller.createCompanyInvoiceAccount,
    config: {
      tags: ['api'],
      description: 'Creates a new invoice account for the specified company and region',
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required().example(EXAMPLE_GUID)
        }),
        payload: Joi.object().keys({
          startDate: Joi.string().isoDate().required().example('2021-01-01'),
          regionId: Joi.string().guid().required().example(EXAMPLE_GUID)
        })
      },
      auth: {
        scope: [billing]
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
        params: Joi.object().keys({
          companyId: Joi.string().uuid().required()
        })
      }
    }
  },

  getCompanyInvoiceAccounts: {
    path: '/water/1.0/companies/{companyId}/invoice-accounts',
    method: 'GET',
    handler: controller.getCompanyInvoiceAccounts,
    config: {
      description: 'Gets all invoice accounts for company, optionally filtered by region',
      tags: ['api'],
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required().example(EXAMPLE_GUID)
        }),
        query: Joi.object().keys({
          regionId: Joi.string().guid().optional().example(EXAMPLE_GUID)
        })
      }
    }
  },

  getCompanyLicences: {
    path: '/water/1.0/companies/{companyId}/licences',
    method: 'GET',
    handler: controller.getCompanyLicences,
    config: {
      description: 'Gets all licences that are currently hooked up to a company',
      tags: ['api'],
      validate: {
        params: Joi.object().keys({
          companyId: Joi.string().guid().required().example(EXAMPLE_GUID)
        })
      }
    }
  }
};
