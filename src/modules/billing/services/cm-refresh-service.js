'use strict';

/**
 * @module syncs the charge module invoices/licences/transactions
 * to the local WRLS DB
 */
const { get } = require('lodash');
const { FlowProducer } = require('bullmq');
const errors = require('../../../lib/errors');
const { redis } = require('../../../../config');

const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs');
const { jobNames } = require('../../../lib/constants');

const batchService = require('./batch-service');

const flowProducer = new FlowProducer({ connection: redis.connection });


const isCMGeneratingSummary = cmResponse => ['generating', 'pending', 'deleting', 'sending'].includes(get(cmResponse, 'billRun.status'));

/**
 * Updates the batch with the given batch ID
 * with data retrieved from the CM
 *
 * @param {String} batchId
 */
const updateBatch = async batchId => {
  // Fetch WRLS batch
  console.log('updating batch 2')
  const batch = await batchService.getBatchById(batchId);
  if (!batch) {
    throw new errors.NotFoundError(`CM refresh failed, batch ${batchId} not found`);
  }

  console.log('updating batch 2: got a response from wrls db')

  // Get CM bill run summary
  const cmResponse = await chargeModuleBillRunConnector.get(batch.externalId);

  console.log('updating batch 2: got a response from cm')

  if (isCMGeneratingSummary(cmResponse)) {
    console.log('updating batch 2: still generating. ')
    return false;
  }
  console.log('updating batch 2: creating flow')

  await flowProducer.add({
    name: jobNames.updateWithCMSummary,
    data: {
      batchId: batch.id,
      cmResponse
    },
    queueName: jobNames.updateWithCMSummary,
    children: [
      {
        name: jobNames.updateInvoices,
        data: { batch, cmResponse },
        queueName: jobNames.updateInvoices
      }
    ],
  });

  return true;
};

exports.updateBatch = updateBatch;
