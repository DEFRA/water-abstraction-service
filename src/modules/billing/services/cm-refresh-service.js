'use strict'

/**
 * @module syncs the charge module invoices/licences/transactions
 * to the local WRLS DB
 */
const errors = require('../../../lib/errors')

const queueManager = require('../../../lib/queue-manager')
const { jobNames } = require('../../../lib/constants')

const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs')

// Services
const batchService = require('./batch-service')

const isCMGeneratingSummary = cmResponse => ['pending', 'sending'].includes(cmResponse.billRun.status)

/**
 * Updates the batch with the given batch ID
 * with data retrieved from the CM
 *
 * @param {String} batchId
 */
const updateBatch = async batchId => {
  // Fetch WRLS batch
  const batch = await batchService.getBatchById(batchId)
  if (!batch) {
    throw new errors.NotFoundError(`CM refresh failed, batch ${batchId} not found`)
  }

  // Get CM bill run summary
  const cmResponse = await chargeModuleBillRunConnector.get(batch.externalId)

  if (isCMGeneratingSummary(cmResponse)) {
    return false
  }

  // Update invoices in batch
  // It is important to update the invoices first so that
  // for a batch containing only re-billing, there are >0 transactions
  // in the batch before calculating the new batch status

  queueManager.getQueueManager().add(jobNames.updateInvoices, { batch, cmResponse })

  await batchService.updateWithCMSummary(batch.id, cmResponse)

  return true
}

exports.updateBatch = updateBatch
