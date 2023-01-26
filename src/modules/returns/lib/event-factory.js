'use strict'

const Event = require('../../../lib/models/event')
const { uploadStatus } = require('./returns-upload')

// Valid event types
const statuses = ['return', 'return.status']

/**
 * Given a return model object, generates an event instance to track
 * return submission
 * @param {Object} ret - water service return model object
 * @return {Event} row of data for water service event log
 */
const createSubmissionEvent = (ret, version, eventType = 'return') => {
  if (!statuses.includes(eventType)) {
    throw new Error(`Invalid event type ${eventType}`)
  }

  const { returnId, licenceNumber, status, receivedDate, underQuery } = ret
  const { type, email, entityId } = ret.user
  const versionId = version?.version_id ? version.version_id : null

  const event = new Event()
  return event.fromHash({
    referenceCode: null,
    type: eventType,
    subtype: type,
    issuer: email,
    licences: [licenceNumber],
    entities: [entityId],
    comment: ret.comment || null,
    metadata: { returnId, versionId, return: ret, receivedDate, underQuery },
    status
  })
}

/**
 * Creates the event object that represent the upload
 * of a bulk returns document.
 * @param {String} uploadUserName The username of end user.
 * @param {String} subtype - csv|xml
 * @returns {Event}
 */
const createBulkUploadEvent = (uploadUserName, subtype = 'csv') => {
  const event = new Event()
  return event.fromHash({
    type: 'returns-upload',
    subtype,
    issuer: uploadUserName,
    status: uploadStatus.PROCESSING
  })
}

exports.createSubmissionEvent = createSubmissionEvent
exports.createBulkUploadEvent = createBulkUploadEvent
