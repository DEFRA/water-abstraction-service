const Joi = require('@hapi/joi');
const controller = require('./controller');
const { statuses } = require('../returns/schema');

const { COMPANY_TYPES, CONTACT_TYPES } = require('./validators/invoice-accounts');

const addressSchema = Joi.object({
  addressId: Joi.string().guid().optional(),
  addressLine1: Joi.string().optional(),
  addressLine2: Joi.string().optional(),
  addressLine3: Joi.string().optional(),
  addressLine4: Joi.string().optional(),
  town: Joi.string().optional(),
  county: Joi.string().optional(),
  country: Joi.string().optional(),
  postcode: Joi.string().optional(),
  uprn: Joi.number().optional()
}).required();

const agentSchema = Joi.object({
  companyId: Joi.string().guid().optional(),
  type: Joi.string().valid(COMPANY_TYPES).optional(),
  name: Joi.string().optional(),
  companyNumber: Joi.string().optional()
}).allow(null).optional();

const contactSchema = Joi.object({
  contactId: Joi.string().guid().optional(),
  type: Joi.string().valid(CONTACT_TYPES).optional(),
  title: Joi.string().optional(),
  firstName: Joi.string().optional(),
  middleInitials: Joi.string().optional(),
  lastName: Joi.string().optional(),
  suffix: Joi.string().optional(),
  department: Joi.string().optional()
}).required();

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
  }
};
