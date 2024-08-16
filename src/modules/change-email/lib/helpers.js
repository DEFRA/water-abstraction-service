const Event = require('../../../lib/models/event.js')

/**
 * create event object to be inserted into event log
 */
const createEventObject = (userName, entityId, newEmail, userId) => {
  const ev = new Event()

  ev.fromHash({
    type: 'user-account',
    subtype: 'email-change',
    issuer: userName,
    entities: [{ entityId }],
    metadata: {
      oldEmail: userName,
      newEmail,
      userId
    },
    status: 'completed'
  })

  return ev
}

exports.createEventObject = createEventObject
