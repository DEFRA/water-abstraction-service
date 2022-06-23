'use strict'

const Event = require('../../../lib/models/event')
const eventService = require('../../../lib/services/events')

const EVENT_TYPES = {
  create: 'billing-batch',
  approveReview: 'billing-batch:approve-review'
}

/**
 * Creates an event in water.events relating to billing batches
 * @param {Object} options
 */
const createBatchEvent = (options) => {
  const batchEvent = new Event()
  batchEvent.type = options.type || EVENT_TYPES.create
  batchEvent.subtype = options.subtype || null
  batchEvent.issuer = options.issuer
  batchEvent.metadata = { batch: options.batch }
  batchEvent.status = options.status
  return eventService.create(batchEvent)
}

exports.createBatchEvent = createBatchEvent
exports.EVENT_TYPES = EVENT_TYPES
