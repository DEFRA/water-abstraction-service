'use strict';
const Joi = require('@hapi/joi');
const controller = require('../controllers/two-part-tariff-review');
const preHandlers = require('../pre-handlers');
const { ROLES: { billing } } = require('../../../lib/roles');

const getBatchLicences = {
  method: 'GET',
  path: '/water/1.0/billing/batches/{batchId}/licences',
  handler: controller.getBatchLicences,
  config: {
    description: 'Gets a list of licences in billing batch for two-part tariff review with statuses',
    validate: {
      params: Joi.object({
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

const getBatchLicenceVolumes = {
  method: 'GET',
  path: '/water/1.0/billing/batches/{batchId}/licences/{licenceId}/billing-volumes',
  handler: controller.getBatchLicenceVolumes,
  config: {
    description: 'Gets a list of licences in billing batch for two-part tariff review with statuses',
    validate: {
      params: Joi.object({
        batchId: Joi.string().uuid().required(),
        licenceId: Joi.string().uuid().required()
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

const deleteBatchLicence = {
  method: 'DELETE',
  path: '/water/1.0/billing/batches/{batchId}/licences/{licenceId}',
  handler: controller.deleteBatchLicence,
  config: {
    description: 'Deletes specified licence from batch',
    validate: {
      params: Joi.object({
        batchId: Joi.string().uuid().required(),
        licenceId: Joi.string().uuid().required()
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

const getBillingVolume = {
  method: 'GET',
  path: '/water/1.0/billing/volumes/{billingVolumeId}',
  handler: controller.getBillingVolume,
  config: {
    description: 'Deletes specified licence from batch',
    validate: {
      params: Joi.object({
        billingVolumeId: Joi.string().uuid().required()
      })
    },
    auth: {
      scope: [billing]
    }
  }
};

const patchBillingVolume = {
  method: 'PATCH',
  path: '/water/1.0/billing/volumes/{billingVolumeId}',
  handler: controller.patchBillingVolume,
  config: {
    description: 'Updates billing volume',
    validate: {
      params: Joi.object({
        billingVolumeId: Joi.string().uuid().required()
      }),
      payload: Joi.object({
        volume: Joi.number().positive().allow(0).required()
      })
    },
    auth: {
      scope: [billing]
    }
  }
};

const postApproveReviewBatch = {
  method: 'POST',
  path: '/water/1.0/billing/batches/{batchId}/approve-review',
  handler: controller.postApproveReviewBatch,
  config: {
    validate: {
      params: Joi.object({
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

exports.getBatchLicences = getBatchLicences;
exports.getBatchLicenceVolumes = getBatchLicenceVolumes;
exports.deleteBatchLicence = deleteBatchLicence;
exports.getBillingVolume = getBillingVolume;
exports.patchBillingVolume = patchBillingVolume;
exports.postApproveReviewBatch = postApproveReviewBatch;
