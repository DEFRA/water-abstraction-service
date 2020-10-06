'use strict';

const Model = require('./model');

const validators = require('./validators');

class ScheduledNotification extends Model {
  get recipient () { return this._recipient; }
  set recipient (value) {
    validators.assertNullableString(value);
    this._recipient = value;
  }

  get messageType () { return this._messageType; }
  set messageType (value) {
    validators.assertNullableString(value);
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
}

module.exports = ScheduledNotification;
