'use strict';

const hoek = require('@hapi/hoek');
const Decimal = require('decimal.js-light');

const Model = require('./model');
const FinancialYear = require('./financial-year');
const User = require('./user');
const { isNull } = require('lodash');
const is = require('@sindresorhus/is');

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
  ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD: 90,
  ERROR_NO_MATCHING_CHARGE_ELEMENT: 100
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
  twoPartTariffStatuses.ERROR_NO_RETURNS_FOR_MATCHING,
  twoPartTariffStatuses.ERROR_NOT_DUE_FOR_BILLING,
  twoPartTariffStatuses.ERROR_RETURN_LINE_OVERLAPS_CHARGE_PERIOD,
  twoPartTariffStatuses.ERROR_NO_MATCHING_CHARGE_ELEMENT
];

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
  * @return {Decimal|Null}
  */
  get calculatedVolume () {
    return this._calculatedVolume || null;
  }

  set calculatedVolume (calculatedVolume) {
    if (isNull(calculatedVolume)) {
      this._calculatedVolume = null;
    } else {
      const value = new Decimal(calculatedVolume);
      if (value.isNegative()) {
        throw new Error(`Expected zero or positive number or Decimal instance, got ${value.toNumber()}`);
      }
      this._calculatedVolume = value;
    }
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
   * Sets the two part tariff status and billable volume
   *
   * When the supplied isSummer flag matches that of this billing volume,
   * the full billable is set.  Otherwise zero is set.
   *
   * @param {Number} twoPartTariffStatus
   * @param {Number} billableVolume
   * @param {Boolean} isSummer
   */
  setTwoPartTariffStatus (twoPartTariffStatus, billableVolume, isSummer) {
    this.twoPartTariffStatus = twoPartTariffStatus;
    if (assignBillableStatuses.includes(twoPartTariffStatus)) {
      this.calculatedVolume = null;
      this.volume = isSummer === this.isSummer ? billableVolume : 0;
    }
    if (setErrorFlagStatuses.includes(twoPartTariffStatus)) {
      this.twoPartTariffError = true;
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

  assertIsNotApproved () {
    hoek.assert(!this.isApproved, 'Cannot allocate/de-allocate on an approved BillingVolume');
  }

  /**
   * Allocates billing volume
   * @param {Number} ML
   */
  allocate (volume) {
    this.assertIsNotApproved();
    const currentVolume = this.calculatedVolume || new Decimal(0);
    this.calculatedVolume = currentVolume.add(volume);
    return this;
  }

  /**
   * De-allocate billing volume
   * @param {Number} ML
   */
  deallocate (volume) {
    this.assertIsNotApproved();
    const currentVolume = this.calculatedVolume || new Decimal(0);
    const isVolumeAvailable = currentVolume.greaterThanOrEqualTo(volume);
    hoek.assert(isVolumeAvailable, `Volume ${volume} cannot be de-allocated, ${currentVolume.toString()} available`);
    this.calculatedVolume = currentVolume.minus(volume);
    return this;
  }

  /**
   * Sets the volume property from the calculatedVolume decimal
   */
  setVolumeFromCalculatedVolume () {
    const { calculatedVolume } = this;

    this.assertIsNotApproved();
    if (!assignBillableStatuses.includes(this.twoPartTariffStatus)) {
      this.volume = is.object(calculatedVolume) && is.directInstanceOf(calculatedVolume, Decimal)
        ? this.calculatedVolume.toDecimalPlaces(6).toNumber()
        : this.calculatedVolume;
    }
    return this;
  }

  /**
   * Gets either the approved volume, or the calculated volume if the billing
   * volume is not yet approved, as a decimal
   * @return {Decimal}
   */
  get approvedOrCalculatedVolume () {
    if (this.isApproved) {
      return isNull(this.volume) ? new Decimal(0) : new Decimal(this.volume);
    }
    return new Decimal(this.calculatedVolume || 0);
  }

  toJSON () {
    return {
      ...super.toJSON(),
      calculatedVolume: isNull(this.calculatedVolume) ? new Decimal(0) : this.calculatedVolume.toDecimalPlaces(6).toNumber()
    };
  }
}

module.exports = BillingVolume;
module.exports.twoPartTariffStatuses = twoPartTariffStatuses;
