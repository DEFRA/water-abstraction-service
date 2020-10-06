'use strict';

const Joi = require('@hapi/joi');

const { version } = require('../../../config');

const pathPrefix = `/water/${version}/invoice-accounts/`;
const controller = require('./controller');

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
  }
};
