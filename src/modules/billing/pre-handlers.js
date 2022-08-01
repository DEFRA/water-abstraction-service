'use strict'

const Boom = require('@hapi/boom')
const batchService = require('./services/batch-service')

/**
 * Pre handler for loading a batch. This function returns the
 * batch so it can be assigned to a property on the request.pre object
 * as defined in the route config.
 *
 * @param {Object} request Hapi request object
 */
const loadBatch = async request => {
  const { batchId } = request.params
  const batch = await batchService.getBatchById(batchId)

  if (!batch) {
    throw Boom.notFound(`No batch found with id: ${batchId}`)
  }

  return batch
}

exports.loadBatch = loadBatch
