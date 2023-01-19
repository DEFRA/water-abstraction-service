'use strict'

const moment = require('moment')
const helpers = require('@envage/water-abstraction-helpers')

const eventHelpers = require('../../../lib/event-helpers')

/**
 * Creates and persists a notification event, decorated with info
 * about the return cycle targeted for this notification
 * @param  {String}  issuer - email address of user sending message
 * @param {Object} config   - message config
 * @param  {Object}  options   - message data - placed in event metadata
 * @return {Promise}          resolves with event data
 */
const createEvent = async (...args) => {
  const evt = eventHelpers.createEvent(...args)

  // The reference date is today + 14 days.  This allows returns notifications
  // to be sent for the following return cycle up to 14 days before the cycle ends
  const refDate = moment().add(14, 'day')

  // Create return cycles
  const cycles = helpers.returns.date.createReturnCycles(undefined, refDate)

  // Decorate event with return cycle info
  evt.metadata.returnCycle = cycles[cycles.length - 1]

  return evt
}

exports.createEvent = createEvent
