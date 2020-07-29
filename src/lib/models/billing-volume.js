'use strict';

const hoek = require('@hapi/hoek');

const Model = require('./model');
const FinancialYear = require('./financial-year');
const User = require('./user');
const { isNull, isFinite } = require('lodash');

const validators = require('./validators');

const twoPartTariffStatuses = {
  ERROR_NO_RETURNS_SUBMITTED: 10,
  ERROR_UNDER_QUERY: 20,
  ERROR_RECEIVED: 30,
  ERROR_SOME_RETURNS_DUE: 40,
  ERROR_LATE_RETURNS: 50,
  ERROR_OVER_ABSTRACTION: 60,
  ERROR_NO_RETURNS_FOR_MATCHING: 70,
  ERROR_NOT_DUE_FOR_BILLING: 80,
  ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD: 90
};

const assignBillableStatuses = [
  twoPartTariffStatuses.ERROR_NO_RETURNS_SUBMITTED,
  twoPartTariffStatuses.ERROR_SOME_RETURNS_DUE,
  twoPartTariffStatuses.ERROR_LATE_RETURNS
];

const setErrorFlagStatuses = [
  twoPartTariffStatuses.ERROR_UNDER_QUERY,
  twoPartTariffStatuses.ERROR_RECEIVED,
  twoPartTariffStatuses.ERROR_SOME_RETURNS_DUE,
  twoPartTariffStatuses.ERROR_OVER_ABSTRACTION,
  twoPartTariffStatuses.ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD,
  twoPartTariffStatuses.ERROR_NO_RETURNS_FOR_MATCHING,
  twoPartTariffStatuses.ERROR_NOT_DUE_FOR_BILLING
];

const toFixedPrecision = number => parseFloat(number.toFixed(3));

class BillingVolume extends Model {
  get chargeElementId () {
    return this._chargeElementId;
  }

  set chargeElementId (chargeElementId) {
    validators.assertId(chargeElementId);
    this._chargeElementId = chargeElementId;
  }

  get billingBatchId () {
    return this._billingBatchId;
  }

  set billingBatchId (billingBatchId) {
    validators.assertId(billingBatchId);
    this._billingBatchId = billingBatchId;
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
    this._calculatedVolume = isNull(calculatedVolume) ? null : parseFloat(calculatedVolume);
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
    if (setErrorFlagStatuses.includes(twoPartTariffStatus)) {
      this.twoPartTariffError = true;
    }
  }

  /**
   * Sets the two part tariff status and billable volume
   * @param {Number} twoPartTariffStatus
   * @param {Number} billableVolume
   */
  setTwoPartTariffStatus (twoPartTariffStatus, billableVolume) {
    this.twoPartTariffStatus = twoPartTariffStatus;
    if (assignBillableStatuses.includes(twoPartTariffStatus)) {
      this.volume = billableVolume;
    }
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
    this._volume = isNull(volume) ? null : parseFloat(volume);
  }

  /**
   * Allocates billing volume
   * @param {Number} ML
   */
  allocate (volume) {
    validators.assertQuantity(volume);
    hoek.assert(this.calculatedVolume === this.volume, `Can't allocate ${volume} when volume and calculated volume differ`);
    this.calculatedVolume = isFinite(this.calculatedVolume) ? this.calculatedVolume + volume : volume;
    this.volume = this.calculatedVolume;
  }

  /**
   * De-allocate billing volume
   * @param {Number} ML
   */
  deallocate (volume) {
    hoek.assert(isFinite(this.calculatedVolume), `Can't deallocate ${volume} when calculated volume is not finite`);
    hoek.assert(this.calculatedVolume === this.volume, `Can't deallocate ${volume} when volume and calculated volume differ`);
    validators.assertQuantityWithMaximum(volume, this.calculatedVolume);
    this.calculatedVolume -= volume;
    this.volume = this.calculatedVolume;
  }

  /**
   * Converts volumes to a fixed precision of 3 DP
   */
  toFixed () {
    if (isFinite(this.volume)) {
      this.volume = toFixedPrecision(this.volume);
    }
    if (isFinite(this.calculatedVolume)) {
      this.calculatedVolume = toFixedPrecision(this.calculatedVolume);
    }
    return this;
  }
}

module.exports = BillingVolume;
module.exports.twoPartTariffStatuses = twoPartTariffStatuses;
