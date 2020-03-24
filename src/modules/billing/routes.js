'use strict';

const Joi = require('@hapi/joi');

const preHandlers = require('./pre-handlers');
const controller = require('./controller');
const { CHARGE_SEASON } = require('../../lib/models/constants');

const getBatches = {
  method: 'GET',
  path: '/water/1.0/billing/batches',
  handler: controller.getBatches,
  config: {
    validate: {
      query: {
        page: Joi.number().integer().optional(),
        perPage: Joi.number().integer().optional()
      }
    }
  }
};

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
        financialYearEnding: Joi.number().required(),
        season: Joi.string().valid(Object.values(CHARGE_SEASON)).required()
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
      },
      query: {
        totals: Joi.boolean().truthy('1').falsy('0').default(false)
      }
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
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

const getBatchInvoicesDetails = {
  method: 'GET',
  path: '/water/1.0/billing/batches/{batchId}/invoices/details',
  handler: controller.getBatchInvoicesDetails,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required()
      }
    }
  }
};

const getBatchInvoiceDetail = {
  method: 'GET',
  path: '/water/1.0/billing/batches/{batchId}/invoices/{invoiceId}',
  handler: controller.getBatchInvoiceDetail,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required(),
        invoiceId: Joi.string().uuid().required()
      }
    }
  }
};

const deleteAccountFromBatch = {
  method: 'DELETE',
  path: '/water/1.0/billing/batches/{batchId}/account/{accountId}',
  handler: controller.deleteAccountFromBatch,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required(),
        accountId: Joi.string().uuid().required()
      }
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const deleteBatch = {
  method: 'DELETE',
  path: '/water/1.0/billing/batches/{batchId}',
  handler: controller.deleteBatch,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required()
      },
      headers: async values => {
        Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
      }
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const postApproveBatch = {
  method: 'POST',
  path: '/water/1.0/billing/batches/{batchId}/approve',
  handler: controller.postApproveBatch,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required()
      },
      headers: async values => {
        Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
      }
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const getBatchLicences = {
  method: 'GET',
  path: '/water/1.0/billing/batches/{batchId}/licences',
  handler: controller.getBatchLicences,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required()
      }
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

exports.getBatch = getBatch;
exports.getBatches = getBatches;
exports.getBatchInvoices = getBatchInvoices;
exports.getBatchInvoiceDetail = getBatchInvoiceDetail;
exports.getBatchInvoicesDetails = getBatchInvoicesDetails;
exports.getBatchLicences = getBatchLicences;

exports.deleteAccountFromBatch = deleteAccountFromBatch;
exports.deleteBatch = deleteBatch;

exports.postApproveBatch = postApproveBatch;
exports.postCreateBatch = postCreateBatch;
