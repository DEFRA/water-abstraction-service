'use-strict'
const Event = require('../../../lib/models/event')
const eventService = require('../../../lib/services/events')

const saveEvent = (type, subtype, licences, status, userName, metadata) => {
  const event = new Event().fromHash({
    issuer: userName,
    type,
    subtype,
    licences,
    metadata,
    status
  })
  return eventService.create(event)
}

module.exports.saveEvent = saveEvent
