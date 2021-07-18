'use strict';

const Joi = require('joi');

const controller = require('../controllers/invoices');
const { ROLES: { billing } } = require('../../../lib/roles');

exports.patchInvoice = {
  method: 'PATCH',
  path: '/water/1.0/billing/invoices/{invoiceId}',
  handler: controller.patchInvoice,
  config: {
    validate: {
      params: Joi.object().keys({
        invoiceId: Joi.string().guid().required()
      }),
      payload: Joi.object().keys({
        isFlaggedForRebilling: Joi.boolean().required()
      })
    },
    auth: {
      scope: [billing]
    }
  }
};
