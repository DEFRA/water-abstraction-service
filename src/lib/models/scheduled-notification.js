'use strict'

const Model = require('./model')
const Event = require('./event')

const validators = require('./validators')

const messageStatuses = {
  draft: 'draft',
  pending: 'pending',
  sending: 'sending',
  sent: 'sent',
  error: 'error'
}

const messageTypes = {
  letter: 'letter',
  email: 'email',
  sms: 'sms'
}

const notifyStatuses = {
  accepted: 'accepted',
  permanentFailure: 'permanent-failure',
  temporaryFailure: 'temporary-failure',
  technicalFailure: 'technical-failure',
  validationFailure: 'validation-failed',
  delivered: 'delivered',
  sending: 'sending',
  received: 'received',
  error: 'error'
}

const displayStatuses = {
  pending: 'pending',
  sent: 'sent',
  error: 'error'
}

const statusMap = new Map()
  .set(messageStatuses.draft, displayStatuses.pending)
  .set(messageStatuses.sending, displayStatuses.pending)
  .set(messageStatuses.pending, displayStatuses.pending)
  .set(messageStatuses.sent, displayStatuses.sent)
  .set(messageStatuses.error, displayStatuses.error)

const notifyStatusMap = new Map()
  .set(notifyStatuses.error, displayStatuses.error)
  .set(notifyStatuses.permanentFailure, displayStatuses.error)
  .set(notifyStatuses.temporaryFailure, displayStatuses.error)
  .set(notifyStatuses.technicalFailure, displayStatuses.error)
  .set(notifyStatuses.validationFailure, displayStatuses.error)
  .set(notifyStatuses.sending, displayStatuses.pending)
  .set(notifyStatuses.delivered, displayStatuses.sent)
  .set(notifyStatuses.received, displayStatuses.sent)
  .set(notifyStatuses.accepted, displayStatuses.sent)

const getDisplayStatus = (status, notifyStatus) =>
  notifyStatusMap.get(notifyStatus) || statusMap.get(status)

class ScheduledNotification extends Model {
  constructor (...args) {
    super(...args)
    this._licences = []
  }

  get recipient () { return this._recipient }
  set recipient (value) {
    validators.assertNullableString(value)
    this._recipient = value
  }

  get messageType () { return this._messageType }
  set messageType (value) {
    validators.assertEnum(value, Object.values(messageTypes))
    this._messageType = value
  }

  get messageRef () { return this._messageRef }
  set messageRef (value) {
    validators.assertNullableString(value)
    this._messageRef = value
  }

  get personalisation () { return this._personalisation }
  set personalisation (value) {
    this._personalisation = value
  }

  get eventId () { return this._eventId }
  set eventId (value) {
    validators.assertNullableId(value)
    this._eventId = value
  }

  get licences () { return this._licences }
  set licences (licenceNumbers) {
    validators.assertIsNullableArrayOfLicenceNumbers(licenceNumbers)
    this._licences = licenceNumbers
  }

  /**
   * This is the status of the message in WRLS and is used to track
   * the full lifecycle of the message, including when it is held in draft
   * status prior to sending
   *
   * @param {String}
   */
  get status () { return this._status }
  set status (value) {
    validators.assertNullableEnum(value, Object.values(messageStatuses))
    this._status = value
  }

  get notifyId () { return this._notifyId }
  set notifyId (value) {
    validators.assertNullableId(value)
    this._notifyId = value
  }

  /**
   * This is the status of the message in Notify and is only populated
   * once the message is sent.
   *
   * This status may be updated several times
   *
   * @param {String}
   */
  get notifyStatus () { return this._notifyStatus }
  set notifyStatus (value) {
    validators.assertNullableString(value)
    this._notifyStatus = value
  }

  /**
   * A simple display status that can be used in the UI
   * @return {String}
   */
  get displayStatus () {
    return getDisplayStatus(this.status, this.notifyStatus)
  }

  /**
   * Event
   * @param {Event}
   */
  set event (event) {
    validators.assertIsNullableInstanceOf(event, Event)
    this._event = event
  }

  get event () {
    return this._event
  }

  get isPdf () {
    return (this.messageRef || '').startsWith('pdf.')
  }

  /**
   * Convert model to JSON
   * @return {Object}
   */
  toJSON () {
    return {
      ...super.toJSON(),
      displayStatus: this.displayStatus,
      isPdf: this.isPdf
    }
  }
}

module.exports = ScheduledNotification
module.exports.MESSAGE_STATUSES = messageStatuses
module.exports.MESSAGE_TYPES = messageTypes
module.exports.NOTIFY_STATUSES = notifyStatuses
module.exports.DISPLAY_STATUSES = displayStatuses
module.exports.getDisplayStatus = getDisplayStatus
