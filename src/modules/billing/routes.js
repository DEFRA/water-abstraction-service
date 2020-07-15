'use strict';

const Joi = require('@hapi/joi');

const preHandlers = require('./pre-handlers');
const controller = require('./controller');

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
        isSummer: Joi.boolean().default(false)
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
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
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
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
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
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const deleteBatchInvoice = {
  method: 'DELETE',
  path: '/water/1.0/billing/batches/{batchId}/invoices/{invoiceId}',
  handler: controller.deleteBatchInvoice,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required(),
        invoiceId: Joi.string().uuid().required()
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

const patchTransactionBillingVolume = {
  method: 'PATCH',
  path: '/water/1.0/billing/transactions/{transactionId}/volume',
  handler: controller.patchTransactionBillingVolume,
  config: {
    validate: {
      params: {
        transactionId: Joi.string().uuid().required()
      },
      payload: {
        volume: Joi.number().positive().allow(0).required()
      },
      headers: async values => {
        Joi.assert(values['defra-internal-user-id'], Joi.number().integer().required());
      }
    }
  }
};

const getInvoiceLicence = {
  method: 'GET',
  path: '/water/1.0/billing/invoice-licences/{invoiceLicenceId}',
  handler: controller.getInvoiceLicenceWithTransactions,
  config: {
    validate: {
      params: {
        invoiceLicenceId: Joi.string().uuid().required()
      }
    }
  }
};

const deleteInvoiceLicence = {
  method: 'DELETE',
  path: '/water/1.0/billing/invoice-licences/{invoiceLicenceId}',
  handler: controller.deleteInvoiceLicence,
  config: {
    validate: {
      params: {
        invoiceLicenceId: Joi.string().uuid().required()
      }
    }
  }
};

const postApproveReviewBatch = {
  method: 'POST',
  path: '/water/1.0/billing/batches/{batchId}/approve-review',
  handler: controller.postApproveReviewBatch,
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

exports.getBatch = getBatch;
exports.getBatches = getBatches;
exports.getBatchInvoices = getBatchInvoices;
exports.getBatchInvoiceDetail = getBatchInvoiceDetail;
exports.getBatchInvoicesDetails = getBatchInvoicesDetails;
exports.getBatchLicences = getBatchLicences;
exports.getInvoiceLicence = getInvoiceLicence;
exports.deleteBatchInvoice = deleteBatchInvoice;
exports.deleteBatch = deleteBatch;

exports.postApproveBatch = postApproveBatch;
exports.postCreateBatch = postCreateBatch;
exports.postApproveReviewBatch = postApproveReviewBatch;

exports.patchTransactionBillingVolume = patchTransactionBillingVolume;
exports.deleteInvoiceLicence = deleteInvoiceLicence;
