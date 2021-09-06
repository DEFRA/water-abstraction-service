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

exports.resetIsFlaggedForRebilling = {
  method: 'PATCH',
  path: '/water/1.0/billing/invoices/rebillingflag/{batchId}/org/{originalInvoiceId}/rebill/{rebillInvoiceId}',
  handler: controller.resetIsFlaggedForRebillingByInvoiceId,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string(),
        originalInvoiceId: Joi.string().required(),
        rebillInvoiceId: Joi.string().required()
      })
    },
    auth: {
      scope: [billing]
    }
  }
};
