'use strict';

const Model = require('./model');

const validators = require('./validators');

const MESSAGE_STATUSES = {
  draft: 'draft',
  sending: 'sending',
  sent: 'sent',
  error: 'error'
};

const MESSAGE_TYPES = {
  letter: 'letter',
  email: 'email',
  sms: 'sms'
};

const NOTIFY_STATUSES = {
  accepted: 'accepted',
  permanentFailure: 'permanent-failure',
  temporaryFailure: 'temporary-failure',
  technicalFailure: 'technical-failure',
  validationFailure: 'validation-failed',
  delivered: 'delivered',
  sending: 'sending',
  received: 'received',
  error: 'error'
};

class ScheduledNotification extends Model {
  constructor (...args) {
    super(...args);
    this._licences = [];
  }

  get recipient () { return this._recipient; }
  set recipient (value) {
    validators.assertNullableString(value);
    this._recipient = value;
  }

  get messageType () { return this._messageType; }
  set messageType (value) {
    validators.assertEnum(value, Object.values(MESSAGE_TYPES));
    this._messageType = value;
  }

  get messageRef () { return this._messageRef; }
  set messageRef (value) {
    validators.assertNullableString(value);
    this._messageRef = value;
  }

  get personalisation () { return this._personalisation; }
  set personalisation (value) {
    this._personalisation = value;
  }

  get eventId () { return this._eventId; }
  set eventId (value) {
    validators.assertNullableId(value);
    this._eventId = value;
  }

  get licences () { return this._licences; }
  set licences (licenceNumbers) {
    validators.assertIsNullableArrayOfLicenceNumbers(licenceNumbers);
    this._licences = licenceNumbers;
  }

  /**
   * This is the status of the message in WRLS and is used to track
   * the full lifecycle of the message, including when it is held in draft
   * status prior to sending
   *
   * @param {String}
   */
  get status () { return this._status; }
  set status (value) {
    validators.assertNullableEnum(value, Object.values(MESSAGE_STATUSES));
    this._status = value;
  }

  get notifyId () { return this._notifyId; }
  set notifyId (value) {
    validators.assertNullableId(value);
    this._notifyId = value;
  }

  /**
   * This is the status of the message in Notify and is only populated
   * once the message is sent.
   *
   * This status may be updated several times
   *
   * @param {String}
   */
  get notifyStatus () { return this._notifyStatus; }
  set notifyStatus (value) {
    validators.assertNullableString(value);
    this._notifyStatus = value;
  }
}

module.exports = ScheduledNotification;
module.exports.MESSAGE_STATUSES = MESSAGE_STATUSES;
module.exports.MESSAGE_TYPES = MESSAGE_TYPES;
module.exports.NOTIFY_STATUSES = NOTIFY_STATUSES;
