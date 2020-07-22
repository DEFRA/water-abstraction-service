const Joi = require('@hapi/joi');
const controller = require('./controller');
const { statuses } = require('../returns/schema');

const { CONTACT_TYPES } = require('../../lib/models/contact-v2');
const { ORGANISATION_TYPES } = require('../../lib/models/company');

const addressSchema = Joi.object({
  addressId: Joi.string().guid().optional(),
  addressLine1: Joi.string().trim().optional(),
  addressLine2: Joi.string().trim().optional(),
  addressLine3: Joi.string().trim().optional(),
  addressLine4: Joi.string().trim().optional(),
  town: Joi.string().trim().optional(),
  county: Joi.string().trim().optional(),
  country: Joi.string().trim().replace(/\./g, '').optional(),
  postcode: Joi.string().trim().optional(),
  uprn: Joi.number().optional()
}).required();

const agentSchema = Joi.object({
  companyId: Joi.string().guid().optional(),
  type: Joi.string().valid(Object.values(ORGANISATION_TYPES)).optional(),
  name: Joi.string().trim().replace(/\./g, '').optional(),
  companyNumber: Joi.string().trim().replace(/\./g, '').uppercase().optional()
}).allow(null).optional();

const contactSchema = Joi.object({
  contactId: Joi.string().guid().optional(),
  type: Joi.string().valid(Object.values(CONTACT_TYPES)).optional(),
  title: Joi.string().trim().optional(),
  firstName: Joi.string().trim().optional(),
  middleInitials: Joi.string().trim().optional(),
  lastName: Joi.string().trim().optional(),
  suffix: Joi.string().trim().optional(),
  department: Joi.string().trim().replace(/\./g, '').optional()
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
