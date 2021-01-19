const Joi = require('@hapi/joi');
const controller = require('./controller');
const { statuses } = require('../returns/schema');
const { logger } = require('../../logger');

const { CONTACT_TYPES } = require('../../lib/models/contact-v2');
const { COMPANY_TYPES, ORGANISATION_TYPES } = require('../../lib/models/company');

const OPTIONAL_NULLABLE_STRING = Joi.string().trim().optional().allow(null);
const EXAMPLE_GUID = '00000000-0000-0000-0000-000000000000';

/**
 * @todo this should use e.g. `id` not `addressId` for consistency with the water service model shape
 */

const addressSchema = Joi.object({
  addressId: Joi.string().guid().optional(),
  addressLine1: OPTIONAL_NULLABLE_STRING,
  addressLine2: OPTIONAL_NULLABLE_STRING,
  addressLine3: OPTIONAL_NULLABLE_STRING,
  addressLine4: OPTIONAL_NULLABLE_STRING,
  town: OPTIONAL_NULLABLE_STRING,
  county: OPTIONAL_NULLABLE_STRING,
  country: OPTIONAL_NULLABLE_STRING,
  postcode: OPTIONAL_NULLABLE_STRING,
  uprn: Joi.number().optional().allow(null),
  source: OPTIONAL_NULLABLE_STRING
}).required();

const agentSchema = Joi.object({
  companyId: Joi.string().guid().optional(),
  type: Joi.string().valid(Object.values(COMPANY_TYPES)).optional(),
  organisationType: Joi.string().valid(Object.values(ORGANISATION_TYPES)).optional(),
  name: Joi.string().trim().replace(/\./g, '').optional(),
  companyNumber: Joi.string().trim().replace(/\./g, '').uppercase().optional()
}).allow(null).optional();

const contactSchema = Joi.object({
  contactId: Joi.string().guid().optional(),
  type: Joi.string().valid(Object.values(CONTACT_TYPES)).optional(),
  title: OPTIONAL_NULLABLE_STRING,
  firstName: OPTIONAL_NULLABLE_STRING,
  initials: OPTIONAL_NULLABLE_STRING,
  middleInitials: OPTIONAL_NULLABLE_STRING,
  lastName: OPTIONAL_NULLABLE_STRING,
  suffix: OPTIONAL_NULLABLE_STRING,
  department: OPTIONAL_NULLABLE_STRING,
  source: OPTIONAL_NULLABLE_STRING,
  isTest: Joi.boolean().optional().default(false)
}).allow(null).optional();

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

  getCompany: {
    path: '/water/1.0/companies/{companyId}',
    method: 'GET',
    handler: controller.getCompany,
    config: {
      description: 'Gets the company with the specified ID',
      validate: {
        params: {
          companyId: Joi.string().guid().required()
        }
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
        query: {
          name: Joi.string().required().min(2),
          soft: Joi.boolean().optional().default(true)
        }
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
        params: {
          companyId: Joi.string().guid().required()
        }
      }
    }
  },

  createCompanyInvoiceAccount: {
    path: '/water/1.0/companies/{companyId}/invoice-accounts',
    method: 'POST',
    handler: controller.createCompanyInvoiceAccount,
    config: {
      description: 'Creates an invoice account for the specified company',
      validate: {
        params: {
          companyId: Joi.string().guid().required()
        },
        payload: {
          startDate: Joi.string().isoDate().required(),
          regionId: Joi.string().guid().required(),
          address: addressSchema,
          agent: agentSchema,
          contact: contactSchema
        },
        failAction: (request, h, err) => {
          logger.error(err.message, request.payload);
          throw err;
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
  },

  getCompanyInvoiceAccounts: {
    path: '/water/1.0/companies/{companyId}/invoice-accounts',
    method: 'GET',
    handler: controller.getCompanyInvoiceAccounts,
    config: {
      description: 'Gets all invoice accounts for company, optionally filtered by region',
      tags: ['api'],
      validate: {
        params: {
          companyId: Joi.string().guid().required().example(EXAMPLE_GUID)
        },
        query: {
          regionId: Joi.string().guid().optional().example(EXAMPLE_GUID)
        }
      }
    }
  }
};
