'use strict';

const Joi = require('@hapi/joi');

const controller = require('../controllers/invoices');

module.exports = {
  getLicenceInvoices: {
    method: 'GET',
    path: '/water/1.0/licences/{licenceId}/invoices',
    handler: controller.getLicenceInvoices,
    config: {
      validate: {
        params: Joi.object({
          licenceId: Joi.string().uuid().required()
        }),
        query: Joi.object({
          page: Joi.number().default(1),
          perPage: Joi.number().default(10)
        })
      }
    }
  }
};
