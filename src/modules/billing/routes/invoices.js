'use strict';

const Joi = require('@hapi/joi');

const controller = require('../controllers/invoices');
const { ROLES: { billing } } = require('../../../lib/roles');

exports.patchInvoice = {
  method: 'PATCH',
  path: '/water/1.0/billing/invoices/{invoiceId}',
  handler: controller.patchInvoice,
  config: {
    validate: {
      params: Joi.object({
        invoiceId: Joi.string().guid().required()
      }),
      payload: Joi.object({
        isFlaggedForRebilling: Joi.boolean().required()
      })
    },
    auth: {
      scope: [billing]
    }
  }
};
