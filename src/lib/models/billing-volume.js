'use strict';

const Model = require('./model');
const FinancialYear = require('./financial-year');
const User = require('./user');

const validators = require('./validators');

const twoPartTariffStatuses = {
  ERROR_NO_RETURNS_SUBMITTED: 10,
  ERROR_UNDER_QUERY: 20,
  ERROR_RECEIVED: 30,
  ERROR_SOME_RETURNS_DUE: 40,
  ERROR_LATE_RETURNS: 50,
  ERROR_OVER_ABSTRACTION: 60,
  ERROR_NO_RETURNS_FOR_MATCHING: 70
};

class BillingVolume extends Model {
  get chargeElementId () {
    return this._chargeElementId;
  }

  set chargeElementId (chargeElementId) {
    validators.assertId(chargeElementId);
    this._chargeElementId = chargeElementId;
  }

  get financialYear () {
    return this._financialYear;
  }

  set financialYear (financialYear) {
    validators.assertIsInstanceOf(financialYear, FinancialYear);
    this._financialYear = financialYear;
  }

  get isSummer () {
    return this._isSummer;
  }

  set isSummer (isSummer) {
    validators.assertIsBoolean(isSummer);
    this._isSummer = isSummer;
  }

  /**
  * The volume determined by returns algorithm
  * @return {Number}
  */
  get calculatedVolume () {
    return this._calculatedVolume;
  }

  set calculatedVolume (calculatedVolume) {
    validators.assertNullableQuantity(calculatedVolume);
    this._calculatedVolume = parseFloat(calculatedVolume);
  }

  /**
    * Whether there is an error from two part tariff matching
    * @return {Boolean}
    */
  get twoPartTariffError () {
    return this._twoPartTariffError;
  }

  set twoPartTariffError (twoPartTariffError) {
    validators.assertIsBoolean(twoPartTariffError);
    this._twoPartTariffError = twoPartTariffError;
  }

  /**
  * The error code from two part tariff matching exercise, null if no error
  * @return {Number}
  */
  get twoPartTariffStatus () {
    return this._twoPartTariffStatus;
  }

  set twoPartTariffStatus (twoPartTariffStatus) {
    validators.assertNullableEnum(twoPartTariffStatus, Object.values(twoPartTariffStatuses));
    this._twoPartTariffStatus = twoPartTariffStatus;
  }

  /**
  * The User who has reviewed the two part tariff error
  * @return {User}
  */
  get twoPartTariffReview () {
    return this._twoPartTariffReview;
  }

  set twoPartTariffReview (twoPartTariffReview) {
    validators.assertIsNullableInstanceOf(twoPartTariffReview, User);
    this._twoPartTariffReview = twoPartTariffReview;
  }

  /**
  * Whether the volume has been approved in the review stage
  * @return {Boolean}
  */
  get isApproved () {
    return this._isApproved;
  }

  set isApproved (isApproved) {
    validators.assertIsBoolean(isApproved);
    this._isApproved = isApproved;
  }

  /**
  * The volume that is approved by the reviewer
  * same as calculated volume or overwritten by user
  * @return {Number}
  */
  get volume () {
    return this._volume;
  }

  set volume (volume) {
    validators.assertNullableQuantity(volume);
    this._volume = parseFloat(volume);
  }
}

module.exports = BillingVolume;
module.exports.twoPartTariffStatuses = twoPartTariffStatuses;
