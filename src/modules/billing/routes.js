'use strict';

const Joi = require('@hapi/joi');

const preHandlers = require('./pre-handlers');
const controller = require('./controller');
const config = require('../../../config');
const { ROLES: { billing } } = require('../../lib/roles');
const BASE_PATH = '/water/1.0/billing/batches';

const getBatches = {
  method: 'GET',
  path: BASE_PATH,
  handler: controller.getBatches,
  config: {
    validate: {
      query: {
        page: Joi.number().integer().optional(),
        perPage: Joi.number().integer().optional()
      }
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
      payload: {
        userEmail: Joi.string().email().required(),
        regionId: Joi.string().uuid().required(),
        batchType: Joi.string().valid('annual', 'supplementary', 'two_part_tariff').required(),
        financialYearEnding: Joi.number().required(),
        isSummer: Joi.boolean().default(false)
      }
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
      params: {
        batchId: Joi.string().uuid().required()
      },
      query: {
        totals: Joi.boolean().truthy('1').falsy('0').default(false)
      }
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
      params: {
        batchId: Joi.string().uuid().required()
      }
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
      params: {
        batchId: Joi.string().uuid().required()
      }
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
      params: {
        batchId: Joi.string().uuid().required(),
        invoiceId: Joi.string().uuid().required()
      }
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
      params: {
        batchId: Joi.string().uuid().required(),
        invoiceId: Joi.string().uuid().required()
      }
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
      params: {
        batchId: Joi.string().uuid().required()
      }
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
      params: {
        batchId: Joi.string().uuid().required()
      }
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
      params: {
        invoiceLicenceId: Joi.string().uuid().required()
      }
    },
    auth: {
      scope: [billing]
    }
  }
};

const postApproveReviewBatch = {
  method: 'POST',
  path: `${BASE_PATH}/{batchId}/approve-review`,
  handler: controller.postApproveReviewBatch,
  config: {
    validate: {
      params: {
        batchId: Joi.string().uuid().required()
      }
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

exports.getBatch = getBatch;
exports.getBatches = getBatches;
exports.getBatchInvoices = getBatchInvoices;
exports.getBatchInvoiceDetail = getBatchInvoiceDetail;
exports.getBatchInvoicesDetails = getBatchInvoicesDetails;
exports.getInvoiceLicence = getInvoiceLicence;
exports.deleteBatchInvoice = deleteBatchInvoice;
exports.deleteBatch = deleteBatch;

exports.postApproveBatch = postApproveBatch;
exports.postCreateBatch = postCreateBatch;
exports.postApproveReviewBatch = postApproveReviewBatch;

const tptRoutes = require('./routes/two-part-tariff-review');
exports.getBatchLicences = tptRoutes.getBatchLicences;
exports.getBatchLicenceVolumes = tptRoutes.getBatchLicenceVolumes;
exports.deleteBatchLicence = tptRoutes.deleteBatchLicence;
exports.getBillingVolume = tptRoutes.getBillingVolume;
exports.patchBillingVolume = tptRoutes.patchBillingVolume;
exports.postApproveReviewBatch = tptRoutes.postApproveReviewBatch;
