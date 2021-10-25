'use strict';

const Joi = require('joi');

const { version } = require('../../../config');

const pathPrefix = `/water/${version}/invoice-accounts/`;
const controller = require('./controller');
const { CONTACT_TYPES } = require('../../lib/models/contact-v2');
const { COMPANY_TYPES, ORGANISATION_TYPES } = require('../../lib/models/company');
const { ROLES: { manageBillingAccounts } } = require('../../lib/roles');

const OPTIONAL_NULLABLE_STRING = Joi.string().trim().optional().allow(null);
const EXAMPLE_GUID = '00000000-0000-0000-0000-000000000000';
const OPTIONAL_GUID = Joi.string().guid().optional().example(EXAMPLE_GUID);
const REQUIRED_GUID = Joi.string().guid().required().example(EXAMPLE_GUID);

const addressSchema = Joi.object({
  id: OPTIONAL_GUID,
  addressLine1: OPTIONAL_NULLABLE_STRING.example('Apple Tree Farm'),
  addressLine2: OPTIONAL_NULLABLE_STRING.example('Buttercup Road'),
  addressLine3: OPTIONAL_NULLABLE_STRING.example('Long Meadow'),
  addressLine4: OPTIONAL_NULLABLE_STRING.example('Windy Ridge'),
  town: OPTIONAL_NULLABLE_STRING.example('Testington'),
  county: OPTIONAL_NULLABLE_STRING.example('Testingshire'),
  country: OPTIONAL_NULLABLE_STRING.example('United Kingdom'),
  postcode: OPTIONAL_NULLABLE_STRING.example('TT1 1TT'),
  uprn: Joi.number().optional().allow(null).example(12345),
  source: OPTIONAL_NULLABLE_STRING.example('wrls')
}).required();

const companySchema = Joi.object().keys({
  id: OPTIONAL_GUID,
  type: Joi.string().valid(...Object.values(COMPANY_TYPES)).optional(),
  organisationType: Joi.string().valid(...Object.values(ORGANISATION_TYPES)).optional(),
  name: Joi.string().trim().replace(/\./g, '').optional().example('Bottled Water Limited'),
  companyNumber: Joi.string().trim().replace(/\./g, '').uppercase().optional().example('012345678')
}).allow(null).required();

const contactSchema = Joi.object().keys({
  id: OPTIONAL_GUID,
  type: Joi.string().valid(...Object.values(CONTACT_TYPES)).optional().allow(null),
  title: OPTIONAL_NULLABLE_STRING.example('Ms'),
  firstName: OPTIONAL_NULLABLE_STRING.example('Janice'),
  initials: OPTIONAL_NULLABLE_STRING,
  middleInitials: OPTIONAL_NULLABLE_STRING.example('A'),
  lastName: OPTIONAL_NULLABLE_STRING.example('Testerson'),
  suffix: OPTIONAL_NULLABLE_STRING.example('MBE'),
  department: OPTIONAL_NULLABLE_STRING.example('Accounts Department'),
  source: OPTIONAL_NULLABLE_STRING.example('wrls'),
  isTest: Joi.boolean().optional().default(false)
}).allow(null).required();

module.exports = {
  getInvoiceAccount: {
    method: 'GET',
    path: `${pathPrefix}{invoiceAccountId}`,
    handler: controller.getInvoiceAccount,
    config: {
      tags: ['api'],
      description: 'Gets invoice account by ID',
      validate: {
        params: Joi.object().keys({
          invoiceAccountId: REQUIRED_GUID
        })
      }
    }
  },

  postInvoiceAccountAddress: {
    method: 'POST',
    path: `${pathPrefix}{invoiceAccountId}/addresses`,
    handler: controller.postInvoiceAccountAddress,
    config: {
      tags: ['api'],
      description: 'Creates a new invoice account address on the invoice account',
      validate: {
        params: Joi.object().keys({
          invoiceAccountId: REQUIRED_GUID
        }),
        payload: Joi.object().keys({
          address: addressSchema,
          agentCompany: companySchema,
          contact: contactSchema
        })
      },
      auth: {
        scope: [manageBillingAccounts]
      }
    }
  },

  getLicences: {
    method: 'GET',
    path: `${pathPrefix}{invoiceAccountId}/licences`,
    handler: controller.getLicences,
    config: {
      tags: ['api'],
      description: 'Gets the licences with current versions linked to this invoice account',
      validate: {
        params: Joi.object().keys({
          invoiceAccountId: REQUIRED_GUID
        })
      }
    }
  },

  getInvoices: {
    method: 'GET',
    path: `${pathPrefix}{invoiceAccountId}/invoices`,
    handler: controller.getInvoices,
    config: {
      tags: ['api'],
      description: 'Gets sent invoices for a given invoice account',
      validate: {
        params: Joi.object().keys({
          invoiceAccountId: REQUIRED_GUID
        }),
        query: Joi.object().keys({
          page: Joi.number().default(1).example(1),
          perPage: Joi.number().default(10).example(10)
        })
      }
    }
  }
};
