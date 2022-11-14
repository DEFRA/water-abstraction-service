const { v4: uuid } = require('uuid')
const event = require('../../../lib/event')

/**
 * create event object to be inserted into event log
 */
const createEventObject = (userName, entityId, newEmail, userId) => {
  return event.create({
    eventId: uuid(),
    type: 'user-account',
    subtype: 'email-change',
    issuer: userName,
    entities: [entityId],
    metadata: {
      oldEmail: userName,
      newEmail,
      userId
    }
  })
}

exports.createEventObject = createEventObject
