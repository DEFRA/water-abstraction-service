'use strict'

const Boom = require('@hapi/boom')

const eventsService = require('../../lib/services/events')
const { eventTypes } = require('../../lib/models/event')

const isValidEvent = event =>
  event && (event.type === eventTypes.notification)

const getEvent = async request => {
  // Get event
  const { eventId } = request.params
  const event = await eventsService.findOne(eventId)

  // If event found and is a "notification" type event, return
  return isValidEvent(event)
    ? event
    : Boom.notFound(`Notification event ${eventId} not found`)
}

exports.getEvent = getEvent
