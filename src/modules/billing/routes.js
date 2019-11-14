const Joi = require('@hapi/joi');

const controller = require('./controller');

const postCreateBatch = {
  method: 'POST',
  path: '/water/1.0/billing/batches',
  handler: controller.postCreateBatch,
  config: {
    validate: {
      payload: {
        userEmail: Joi.string().email().required(),
        regionId: Joi.string().uuid().required(),
        batchType: Joi.string().valid('annual', 'supplementary', 'two_part_tariff').required(),
        financialYear: Joi.number().required(),
        season: Joi.string().valid('summer', 'winter', 'all year').required()
      }
    }
  }
};

const getBatch = {
  method: 'GET',
  path: '/water/1.0/billing/batches/{batchId}',
  handler: controller.getBatch,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required()
      }
    }
  }
};

const getBatchInvoices = {
  method: 'GET',
  path: '/water/1.0/billing/batches/{batchId}/invoices',
  handler: controller.getBatchInvoices,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required()
      }
    }
  }
};

const getInvoiceDetail = {
  method: 'GET',
  path: '/water/1.0/billing/invoices/{invoiceId}',
  handler: controller.getInvoiceDetail,
  config: {
    validate: {
      params: {
        invoiceId: Joi.string().uuid().required()
      }
    }
  }
};

exports.postCreateBatch = postCreateBatch;
exports.getBatch = getBatch;
exports.getBatchInvoices = getBatchInvoices;
exports.getInvoiceDetail = getInvoiceDetail;
