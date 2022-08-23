const promisePoller = require('promise-poller').default

const { ROLES } = require('../../../src/lib/roles')

const { server } = require('../../../index')

const batches = require('./batches')

/**
 * Run scenario by injecting request into hapi server
 * @param {Object} scenario
 * @param {String} batchType
 * @param {Number} [financialYearEnding] - defaults to 2020
 * @param {Boolean} [isSummer]
 * @return {String} batchId
 */
const runScenario = async (regionId, batchType, financialYearEnding = 2020, isSummer = false) => {
  await server.start()
  const response = await server.inject({
    auth: {
      strategy: 'jwt',
      credentials: {
        scope: [ROLES.billing]
      }
    },
    method: 'POST',
    url: '/water/1.0/billing/batches',
    payload: {
      userEmail: 'test@example.com',
      regionId,
      batchType,
      financialYearEnding,
      isSummer
    }
  })
  const batchId = JSON.parse(response.payload).data.batch.id
  return getBatchWhenProcessed(batchId)
}

/**
 * Gets batch by ID.
 * If batch is not processed, an error is thrown
 * @param {String} batchId
 * @return {Promise<Object>}
 */
const getProcessedBatch = async batchId => {
  console.log(`Test: polling batch ${batchId}`)
  const batch = await batches.getBatchById(batchId)
  if (batch.get('status') === 'processing') {
    throw new Error('Batch still processing')
  }
  return batch.toJSON()
}

/**
 * Gets batch when processing is complete
 * @return {Promise}
 */
const getBatchWhenProcessed = batchId => promisePoller({
  taskFn: () => getProcessedBatch(batchId),
  interval: 5000,
  retries: 30
})

/**
   * Approves the review stage of a two part tariff batch, the water
   * service will then kick off the next job to continue processing
   * the batch
   *
   * @param {String} batchId UUID of the batch to approve review on
   */
const approveTwoPartTariffBatch = async (batchId) => {
  await server.inject({
    auth: {
      strategy: 'jwt',
      credentials: {
        scope: [ROLES.billing],
        id: 0,
        email: 'mail@example.com'
      }
    },
    method: 'POST',
    url: `/water/1.0/billing/batches/${batchId}/approve-review`
  })

  return getBatchWhenProcessed(batchId)
}

exports.approveTwoPartTariffBatch = approveTwoPartTariffBatch
exports.runScenario = runScenario
