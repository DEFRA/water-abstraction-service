'use strict'

/**
 * @module syncs the charge module invoices/licences/transactions
 * to the local WRLS DB
 */
const errors = require('../../../lib/errors')

const queueManager = require('../../../lib/queue-manager')

const chargeModuleBillRunConnector = require('../../../lib/connectors/charge-module/bill-runs')

// Services
const batchService = require('./batch-service')

const isCMGeneratingSummary = cmResponse => ['pending', 'sending'].includes(cmResponse.billRun.status)

const updateBatch = async (batchId, nextJobName) => {
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

  queueManager.getQueueManager().add(nextJobName, { batch, cmResponse })

  await batchService.updateWithCMSummary(batch.id, cmResponse)

  return true
}

exports.updateBatch = updateBatch
