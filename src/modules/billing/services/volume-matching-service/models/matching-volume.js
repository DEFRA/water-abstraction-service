'use strict';

const Decimal = require('decimal.js-light');

const Model = require('../../../../../lib/models/model.js');
const BillingVolume = require('../../../../../lib/models/billing-volume.js');

const validators = require('../../../../../lib/models/validators');
const { twoPartTariffStatuses } = BillingVolume;

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

/**
 * @class a class to hold the volume as a decimal while the TPT matching algorithm
 *        is processed
 */
class MatchingVolume extends Model {
  constructor (...args) {
    super(...args);
    this.calculatedVolume = new Decimal(0);
  }

  /**
   * Indicates this is holding volumes from summer returns
   * @return {Boolean}
   */
  get isSummer () {
    return this._isSummer;
  }

  set isSummer (isSummer) {
    validators.assertIsBoolean(isSummer);
    this._isSummer = isSummer;
  }

  /**
   * Creates a BillingVolume model
   * @param {ChargeElement} chargeElement
   */
  toBillingVolume (chargeElement) {
    const model = new BillingVolume().fromHash({
      chargeElementId: chargeElement.id,
      isSummer: this.isSummer,
      twoPartTariffStatus: this.twoPartTariffStatus,
      twoPartTariffError: setErrorFlagStatuses.includes(this.twoPartTariffStatus)
    });

    // Assign full billable
    if (assignBillableStatuses.includes(this.billingVolume.twoPartTariffStatus)) {
      model.fromHash({
        calculatedVolume: null,
        volume: chargeElement.volume
      });
    } else {
      // Assign calculated volume
      const calculatedVolume = this.calculatedVolume.toDecimalPlaces(6);
      model.fromHash({
        calculatedVolume,
        volume: calculatedVolume
      });
    }
    return model;
  }

  /**
   * Allocates calculated volume
   * @param {Number} ML
   */
  allocate (decimal) {
    validators.assertIsInstanceOf(decimal, Decimal);
    this.calculatedVolume.plus(decimal);
    return this;
  }

  /**
   * De-allocate calculated volume
   * @param {Number} ML
   */
  deallocate (decimal) {
    validators.assertIsInstanceOf(decimal, Decimal);
    this.calculatedVolume.minus(decimal);
    return this;
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
}

module.exports = MatchingVolume;
