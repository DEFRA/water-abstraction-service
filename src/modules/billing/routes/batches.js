'use strict';

const Joi = require('joi');

const preHandlers = require('../pre-handlers');
const controller = require('../controllers/batches');
const config = require('../../../../config');
const { ROLES: { billing } } = require('../../../lib/roles');
const BASE_PATH = '/water/1.0/billing/batches';
const { postApproveReviewBatch: postApproveReviewBatchController } = require('../controllers/two-part-tariff-review');

const getBatches = {
  method: 'GET',
  path: BASE_PATH,
  handler: controller.getBatches,
  config: {
    validate: {
      query: Joi.object().keys({
        page: Joi.number().integer().optional(),
        perPage: Joi.number().integer().optional()
      })
    },
    auth: {
      scope: [billing]
    }
  }
};

const postCreateBatch = {
  method: 'POST',
  path: BASE_PATH,
  handler: controller.postCreateBatch,
  config: {
    validate: {
      payload: Joi.object().keys({
        userEmail: Joi.string().email().required(),
        regionId: Joi.string().uuid().required(),
        batchType: Joi.string().valid('annual', 'supplementary', 'two_part_tariff').required(),
        financialYearEnding: Joi.number().required(),
        isSummer: Joi.boolean().default(false)
      })
    },
    auth: {
      scope: [billing]
    }
  }
};

const getBatch = {
  method: 'GET',
  path: `${BASE_PATH}/{batchId}`,
  handler: controller.getBatch,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const getBatchInvoices = {
  method: 'GET',
  path: `${BASE_PATH}/{batchId}/invoices`,
  handler: controller.getBatchInvoices,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const getBatchInvoicesDetails = {
  method: 'GET',
  path: `${BASE_PATH}/{batchId}/invoices/details`,
  handler: controller.getBatchInvoicesDetails,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const getBatchInvoiceDetail = {
  method: 'GET',
  path: `${BASE_PATH}/{batchId}/invoices/{invoiceId}`,
  handler: controller.getBatchInvoiceDetail,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required(),
        invoiceId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const deleteBatchInvoice = {
  method: 'DELETE',
  path: `${BASE_PATH}/{batchId}/invoices/{invoiceId}`,
  handler: controller.deleteBatchInvoice,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required(),
        invoiceId: Joi.string().uuid().required()
      }),
      query: Joi.object().keys({
        originalInvoiceId: Joi.string().uuid().optional(),
        rebillInvoiceId: Joi.string().uuid().optional()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const deleteBatch = {
  method: 'DELETE',
  path: `${BASE_PATH}/{batchId}`,
  handler: controller.deleteBatch,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const postApproveBatch = {
  method: 'POST',
  path: `${BASE_PATH}/{batchId}/approve`,
  handler: controller.postApproveBatch,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const getInvoiceLicence = {
  method: 'GET',
  path: '/water/1.0/billing/invoice-licences/{invoiceLicenceId}',
  handler: controller.getInvoiceLicenceWithTransactions,
  config: {
    validate: {
      params: Joi.object().keys({
        invoiceLicenceId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    }
  }
};

const postApproveReviewBatch = {
  method: 'POST',
  path: `${BASE_PATH}/{batchId}/approve-review`,
  handler: postApproveReviewBatchController,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const getBatchDownloadData = {
  method: 'GET',
  path: `${BASE_PATH}/{batchId}/download-data`,
  handler: controller.getBatchDownloadData,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

if (config.featureToggles.deleteAllBillingData) {
  const deleteAllBillingData = {
    method: 'DELETE',
    path: BASE_PATH,
    handler: controller.deleteAllBillingData,
    config: {
      description: 'Deletes all billing and charge version data (!)',
      auth: {
        scope: [billing]
      }
    }
  };

  exports.deleteAllBillingData = deleteAllBillingData;
}

const postSetBatchStatusToCancel = {
  method: 'POST',
  path: `${BASE_PATH}/{batchId}/status/cancel`,
  handler: controller.postSetBatchStatusToCancel,
  config: {
    validate: {
      params: Joi.object().keys({
        batchId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    },
    pre: [
      { method: preHandlers.loadBatch, assign: 'batch' }
    ]
  }
};

const getBatchBillableYears = {
  method: 'POST',
  path: `${BASE_PATH}/billable-years`,
  handler: controller.getBatchBillableYears,
  config: {
    validate: {
      payload: Joi.object().keys({
        userEmail: Joi.string().email().required(),
        regionId: Joi.string().uuid().required(),
        isSummer: Joi.boolean().default(false),
        currentFinancialYear: Joi.number().required()
      })
    }
    // auth: {
    //   scope: [billing]
    // }
  }
};

module.exports = {
  getBatchBillableYears,
  getBatch,
  getBatches,
  getBatchInvoices,
  getBatchInvoiceDetail,
  getBatchInvoicesDetails,
  getInvoiceLicence,
  deleteBatchInvoice,
  deleteBatch,
  postApproveBatch,
  postCreateBatch,
  postApproveReviewBatch,
  getBatchDownloadData,
  postSetBatchStatusToCancel
};
