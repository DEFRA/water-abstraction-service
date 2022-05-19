const Event = require('../../../lib/models/event')
const eventService = require('../../../lib/services/events')

const createContactEvent = options => {
  const event = new Event()
  event.type = 'contact:create'
  event.issuer = options.issuer
  event.metadata = { contact: options.contact }
  event.status = 'created'
  return eventService.create(event)
}

exports.createContactEvent = createContactEvent
