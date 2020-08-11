'use strict';

const Model = require('./model');
const validators = require('./validators');

class ChargeAgreement extends Model {
  get code () { return this._code; }
  set code (code) {
    validators.assertAgreementCode(code);
    this._code = code;
  }

  get startDate () { return this._startDate; }
  set startDate (value) {
    this._startDate = this.getDateOrThrow(value);
  }

  get endDate () { return this._endDate; }
  set endDate (value) {
    this._endDate = this.getDateTimeFromValue(value);
  }

  get description () { return this._description; }
  set description (description) {
    validators.assertNullableString(description);
    this._description = description;
  }

  get dateCreated () { return this._dateCreated; }
  set dateCreated (value) {
    this._dateCreated = this.getDateTimeFromValue(value);
  }

  get dateUpdated () { return this._dateUpdated; }
  set dateUpdated (value) {
    this._dateUpdated = this.getDateTimeFromValue(value);
  }
}

module.exports = ChargeAgreement;
