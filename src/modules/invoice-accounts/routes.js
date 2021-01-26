'use strict';

const Joi = require('@hapi/joi');

const { version } = require('../../../config');

const pathPrefix = `/water/${version}/invoice-accounts/`;
const controller = require('./controller');
const { CONTACT_TYPES } = require('../../lib/models/contact-v2');
const { COMPANY_TYPES, ORGANISATION_TYPES } = require('../../lib/models/company');

const OPTIONAL_NULLABLE_STRING = Joi.string().trim().optional().allow(null);
const EXAMPLE_GUID = '00000000-0000-0000-0000-000000000000';
const OPTIONAL_GUID = Joi.string().guid().optional().example(EXAMPLE_GUID);

const addressSchema = Joi.object({
  id: OPTIONAL_GUID,
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

const companySchema = Joi.object({
  id: OPTIONAL_GUID,
  type: Joi.string().valid(Object.values(COMPANY_TYPES)).optional(),
  organisationType: Joi.string().valid(Object.values(ORGANISATION_TYPES)).optional(),
  name: Joi.string().trim().replace(/\./g, '').optional(),
  companyNumber: Joi.string().trim().replace(/\./g, '').uppercase().optional()
}).allow(null).optional();

const contactSchema = Joi.object({
  id: OPTIONAL_GUID,
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
  getInvoiceAccount: {
    method: 'GET',
    path: `${pathPrefix}{invoiceAccountId}`,
    handler: controller.getInvoiceAccount,
    config: {
      description: 'Gets invoice account by ID',
      validate: {
        params: {
          invoiceAccountId: Joi.string().guid().required()
        }
      }
    }
  },

  postInvoiceAccountAddress: {
    method: 'POST',
    path: `${pathPrefix}{invoiceAccountId}/addresses`,
    handler: controller.postInvoiceAccountAddress,
    config: {
      description: 'Gets invoice account by ID',
      validate: {
        params: {
          invoiceAccountId: Joi.string().guid().required()
        },
        payload: {
          startDate: Joi.string().isoDate().required(),
          address: addressSchema,
          agentCompany: companySchema,
          contact: contactSchema
        },
        failAction: (req, h, err) => {
          console.error(err);
          throw err;
        }
      }
    }
  }
};
