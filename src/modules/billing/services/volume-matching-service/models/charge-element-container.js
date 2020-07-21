'use strict';

const ChargeElement = require('../../../../../lib/models/charge-element');
const DateRange = require('../../../../../lib/models/date-range');
const ReturnLine = require('../../../../../lib/models/return-line');

const BillingVolume = require('../../../../../lib/models/billing-volume');
const { CHARGE_SEASON } = require('../../../../../lib/models/constants');

const validators = require('../../../../../lib/models/validators');

/**
 * Gets a moment range for the charge element, taking into account
 * - the charge period (limited by charge version start/end, licence start/end, financial year)
 * - time-limited dates of charge element
 * @param {ChargeElement} chargeElement
 * @param {DateRange} chargePeriod
 * @return {MomentRange}
 */
const getChargeElementRange = (chargeElement, chargePeriod) => {
  if (chargeElement.timeLimitedPeriod) {
    const rangeA = chargeElement.timeLimitedPeriod.toMomentRange();
    const rangeB = chargePeriod.toMomentRange();
    return rangeA.intersect(rangeB);
  }
  return chargePeriod.toMomentRange();
};

/**
 * Creates a BillingVolume model to accept the data for the supplied
 * charge element
 * @param {ChargeElement} chargeElement
 * @return {BillingVolume}
 */
const createBillingVolume = chargeElement => {
  const billingVolume = new BillingVolume();
  return billingVolume.fromHash({
    chargeElementId: chargeElement.id,
    isSummer: chargeElement.abstractionPeriod.getChargeSeason() === CHARGE_SEASON.summer
  });
};

class ChargeElementContainer {
  /**
   * @constructor
   * @param {ChargeElement} [chargeElement]
   * @param {DateRange} [chargePeriod]
   */
  constructor (chargeElement, chargePeriod) {
    if (chargeElement) {
      this.chargeElement = chargeElement;
    }
    if (chargePeriod) {
      this.chargePeriod = chargePeriod;
    }
  }

  /**
   * Refreshes charge element date range and abstraction days
   */
  refresh () {
    if (this._chargeElement && this._chargePeriod) {
      this._dateRange = getChargeElementRange(this._chargeElement, this._chargePeriod);
      this._abstractionDays = this._chargeElement.abstractionPeriod.getDays(DateRange.fromMomentRange(this._dateRange));
    }
  }

  /**
   * Sets the charge element
   * @param {ChargeElement} chargeElement
   */
  set chargeElement (chargeElement) {
    validators.assertIsInstanceOf(chargeElement, ChargeElement);
    this._chargeElement = chargeElement;
    this._billingVolume = createBillingVolume(chargeElement);
    this.refresh();
  }

  /**
   * Gets the charge element
   * @return {ChargeElement}
   */
  get chargeElement () {
    return this._chargeElement;
  }

  /**
   * Sets the charge period
   * @param {DateRange} chargePeriod
   */
  set chargePeriod (chargePeriod) {
    validators.assertIsInstanceOf(chargePeriod, DateRange);
    this._chargePeriod = chargePeriod;
    this.refresh();
  }

  /**
   * Gets the billing volume
   * @return {BillingVolume}
   */
  get billingVolume () {
    return this._billingVolume;
  }

  /**
   * Get the number of abstraction days
   * @return {Number}
   */
  get abstractionDays () {
    return this._abstractionDays;
  }

  /**
   * Checks the abs period and time-limited dates
   * match the return line specified
   * @param {ReturnLine} returnLine
   * @return {Boolean}
   */
  isReturnLineMatch (returnLine) {
    validators.assertIsInstanceOf(returnLine, ReturnLine);
    const { abstractionPeriod } = this._chargeElement;
    const { startDate, endDate } = returnLine.dateRange;

    const isAbsPeriodMatch = [
      abstractionPeriod.isDateWithinAbstractionPeriod(startDate),
      abstractionPeriod.isDateWithinAbstractionPeriod(endDate)
    ].includes(true);

    const isDateRangeMatch = [
      this._dateRange.includes(startDate),
      this._dateRange.includes(endDate)
    ].includes(true);

    return isAbsPeriodMatch && isDateRangeMatch;
  }

  /**
   * Checks if two-part tariff purpose on charge element
   * @return {Boolean}
   */
  get isTwoPartTariffPurpose () {
    return this._chargeElement.purposeUse.isTwoPartTariff;
  }

  /**
   * Checks if summer billing volume
   * @return {Boolean}
   */
  get isSummer () {
    return this._billingVolume.isSummer;
  }
}

module.exports = ChargeElementContainer;
