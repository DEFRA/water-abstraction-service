'use strict';

const ChargeElement = require('../../../../../lib/models/charge-element');
const DateRange = require('../../../../../lib/models/date-range');
const ReturnLine = require('../../../../../lib/models/return-line');
const BillingVolume = require('../../../../../lib/models/billing-volume');

const { CHARGE_SEASON } = require('../../../../../lib/models/constants');

const validators = require('../../../../../lib/models/validators');
const FinancialYear = require('../../../../../lib/models/financial-year');

/**
 * Gets a DateRange range for the charge element, taking into account
 * - the charge period (limited by charge version start/end, licence start/end, financial year)
 * - time-limited dates of charge element
 * @param {ChargeElement} chargeElement
 * @param {DateRange} chargePeriod
 * @return {DateRange}
 */
const getChargeElementRange = (chargeElement, chargePeriod) => {
  if (chargeElement.timeLimitedPeriod) {
    const rangeA = chargeElement.timeLimitedPeriod.toMomentRange();
    const rangeB = chargePeriod.toMomentRange();
    const intersection = rangeA.intersect(rangeB);
    return intersection ? DateRange.fromMomentRange(intersection) : null;
  }
  return chargePeriod;
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

/**
 * Allows a ChargeElement to be grouped together with
 * its related BillingVolume during the TPT matching process
 * @class
 */
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
  _refresh () {
    if (this._chargeElement && this._chargePeriod) {
      this._dateRange = getChargeElementRange(this._chargeElement, this._chargePeriod);
      this._abstractionDays = this._dateRange ? this._chargeElement.abstractionPeriod.getDays(this._dateRange) : 0;
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
    this._refresh();
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
    this._refresh();
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
   * Note: it only compares dates, it does not check the purpose or
   * season compatibility - this is handled elsewhere
   * @param {ReturnLine} returnLine
   * @return {Boolean}
   */
  isReturnLineMatch (returnLine) {
    validators.assertIsInstanceOf(returnLine, ReturnLine);

    const isAbsPeriodMatch = this.chargeElement.abstractionPeriod.isDateRangeOverlapping(returnLine.dateRange);
    const isDateRangeMatch = this._dateRange && this._dateRange.overlaps(returnLine.dateRange);

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
   * Checks whether this charge element applies based on 
   * the date ranges (e.g. the date range of this element overlaps the charge period)
   * @return {Boolean}
   */
  get isValidForChargePeriod () {
    return !!this._dateRange;
  }


  /**
   * Checks if summer billing volume
   * @return {Boolean}
   */
  get isSummer () {
    return this._billingVolume.isSummer;
  }

  /**
   * Gets score for sorting elements
   * @return {Number}
   */
  get score () {
    // If charge element is a supported source, we give these preference
    // abstractionDays is a max of 366
    const isSupported = this.chargeElement.source === ChargeElement.sources.supported;
    return isSupported ? this.abstractionDays : this.abstractionDays + 1000;
  }

  /**
   * Sets the two part tariff error status code
   * @param {Number} twoPartTariffStatus
   */
  setTwoPartTariffStatus (twoPartTariffStatus) {
    const { volume } = this.chargeElement;
    this.billingVolume.setTwoPartTariffStatus(twoPartTariffStatus, volume);
  }

  /**
   * Gets volume available for matching
   * @return {Number}
   */
  getAvailableVolume () {
    const volume = this.chargeElement.volume - (this.billingVolume.calculatedVolume || 0);
    return volume > 0 ? volume : 0;
  }

  /**
   * Checks whether over-abstracted
   * @return {Boolean}
   */
  flagOverAbstraction () {
    const volume = this.billingVolume.calculatedVolume || 0;
    const isOverAbstraction = volume > this.chargeElement.volume;
    if (isOverAbstraction) {
      this.billingVolume.setTwoPartTariffStatus(BillingVolume.twoPartTariffStatuses.ERROR_OVER_ABSTRACTION);
    }
  }

  /**
   * Sets financial year of BillingVolume model
   * @param {FinancialYear} financialYear
   */
  setFinancialYear (financialYear) {
    validators.assertIsInstanceOf(financialYear, FinancialYear);
    this.billingVolume.financialYear = financialYear;
  }
}

module.exports = ChargeElementContainer;
