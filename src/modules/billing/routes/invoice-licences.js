'use strict'

const Joi = require('joi')

const controller = require('../controllers/invoice-licences')
const { ROLES: { billing } } = require('../../../lib/roles')

exports.deleteInvoiceLicence = {
  method: 'DELETE',
  path: '/water/1.0/billing/invoice-licences/{invoiceLicenceId}',
  handler: controller.deleteInvoiceLicence,
  config: {
    validate: {
      params: Joi.object({
        invoiceLicenceId: Joi.string().guid().required()
      })
    },
    auth: {
      scope: [billing]
    }
  }
}
