'use strict';

const Decimal = require('decimal.js-light');

// Models
const ChargeElement = require('../../../../../lib/models/charge-element');
const DateRange = require('../../../../../lib/models/date-range');
const ReturnLine = require('../../../../../lib/models/return-line');
const BillingVolume = require('../../../../../lib/models/billing-volume');
const FinancialYear = require('../../../../../lib/models/financial-year');

const { RETURN_SEASONS, CHARGE_SEASON } = require('../../../../../lib/models/constants');

const validators = require('../../../../../lib/models/validators');
const decimalHelpers = require('../../../../../lib/decimal-helpers');

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
const createBillingVolume = (chargeElement, isSummer) => {
  const billingVolume = new BillingVolume();
  return billingVolume.fromHash({
    chargeElementId: chargeElement.id,
    isSummer,
    volume: 0,
    calculatedVolume: 0
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

    // Initialse a pair of billing volumes - each will hold data for either
    // summer or winter/all year returns
    this._billingVolumes = {
      [RETURN_SEASONS.summer]: createBillingVolume(chargeElement, true),
      [RETURN_SEASONS.winterAllYear]: createBillingVolume(chargeElement, false)
    };

    this._refresh();
  }

  /**
   * Gets the charge element
   * @return {ChargeElement}
   */
  get chargeElement () {
    return this._chargeElement;
  }

  get chargePeriod () {
    return this._chargePeriod;
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
   * Sets a billing volume
   * @param {BillingVolume} billingVolume
   */
  setBillingVolume (billingVolume) {
    validators.assertIsInstanceOf(billingVolume, BillingVolume);
    const key = billingVolume.isSummer ? RETURN_SEASONS.summer : RETURN_SEASONS.winterAllYear;
    this._billingVolumes[key] = billingVolume;
  }

  /**
   * Gets the billing volumes
   * @return {Array<BillingVolume>}
   */
  get billingVolumes () {
    return Object.values(this._billingVolumes);
  }

  /**
   * Get the billingVolume for the supplied return season
   * @param {String} returnSeason
   */
  getBillingVolume (returnSeason) {
    validators.assertEnum(returnSeason, Object.values(RETURN_SEASONS));
    return this._billingVolumes[returnSeason];
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
   * Checks if two-part tariff purpose on charge element, and that the element
   * hasn't been disabled for TPT billing
   * @return {Boolean}
   */
  get isTwoPartTariffPurpose () {
    return this._chargeElement.purposeUse.isTwoPartTariff &&
      this._chargeElement.isSection127AgreementEnabled;
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
   * Checks if the charge element has a summer abs period
   * @return {Boolean}
   */
  get isSummer () {
    return this._chargeElement.abstractionPeriod.getChargeSeason() === CHARGE_SEASON.summer;
  }

  /**
   * Gets score for sorting elements
   * @param {String} returnSeason
   * @return {Number}
   */
  getScore (returnSeason) {
    validators.assertEnum(returnSeason, Object.values(RETURN_SEASONS));

    let score = 0;

    // Give summer elements precedence if matching summer returns
    if (this.isSummer && (returnSeason === RETURN_SEASONS.summer)) {
      score -= 1000;
    }

    // Give supported source precedence
    if (this.chargeElement.source === ChargeElement.sources.supported) {
      score -= 1000;
    }

    // Give elements with fewer abs days precedence
    score += this.abstractionDays;

    return score;
  }

  /**
   * Sets the two part tariff error status code
   * @param {String} returnSeason
   * @param {Number} twoPartTariffStatus
   */
  setTwoPartTariffStatus (returnSeason, twoPartTariffStatus) {
    validators.assertEnum(returnSeason, Object.values(RETURN_SEASONS));
    const { volume } = this.chargeElement;
    this._billingVolumes[returnSeason].setTwoPartTariffStatus(twoPartTariffStatus, volume, this.isSummer);
  }

  /**
   * Gets volume available for matching
   * @return {Decimal}
   */
  getAvailableVolume () {
    const available = new Decimal(this.chargeElement.volume)
      .minus(this.totalVolume);

    return decimalHelpers.max(new Decimal(0), available);
  }

  /**
   * Gets the billing volume for summer
   * @return {Decimal|Number}
   */
  get summerVolume () {
    return this._billingVolumes[RETURN_SEASONS.summer].approvedOrCalculatedVolume || new Decimal(0);
  }

  /**
   * Gets the billing volume for winter/all year
   * @return {Decimal|Number}
   */
  get winterAllYearVolume () {
    return this._billingVolumes[RETURN_SEASONS.winterAllYear].approvedOrCalculatedVolume || new Decimal(0);
  }

  /**
   * Gets the total billing volume for both seasons
   * @return {Decimal}
   */
  get totalVolume () {
    const a = new Decimal(this.summerVolume);
    const b = new Decimal(this.winterAllYearVolume);
    return a.plus(b);
  }

  /**
   * Flags over-abstraction
   * @param {String} returnSeason
   * @return {this}
   */
  flagOverAbstraction (returnSeason) {
    validators.assertEnum(returnSeason, Object.values(RETURN_SEASONS));

    // Summer happens first, so we are either considering summer or summer+winter
    const volume = returnSeason === RETURN_SEASONS.summer ? this.summerVolume : this.totalVolume;

    const isOverAbstraction = volume.greaterThan(new Decimal(this.chargeElement.volume));

    if (isOverAbstraction) {
      this._billingVolumes[returnSeason].setTwoPartTariffStatus(BillingVolume.twoPartTariffStatuses.ERROR_OVER_ABSTRACTION);
    }
    return this;
  }

  /**
   * Sets financial year of BillingVolume model
   * @param {FinancialYear} financialYear
   * @return {this}
   */
  setFinancialYear (financialYear) {
    validators.assertIsInstanceOf(financialYear, FinancialYear);
    this._billingVolumes[RETURN_SEASONS.summer].financialYear = financialYear;
    this._billingVolumes[RETURN_SEASONS.winterAllYear].financialYear = financialYear;
    return this;
  }

  /**
   * Allocates return volume to the billing volume for the supplied season
   * @param {String} returnSeason
   * @param {Number} volume
   */
  allocate (returnSeason, volume) {
    validators.assertEnum(returnSeason, Object.values(RETURN_SEASONS));
    this._billingVolumes[returnSeason].allocate(volume);
  }

  /**
   * De-allocates return volume to the billing volume for the supplied season
   * @param {String} returnSeason
   * @param {Number} volume
   */
  deallocate (returnSeason, volume) {
    validators.assertEnum(returnSeason, Object.values(RETURN_SEASONS));
    this._billingVolumes[returnSeason].deallocate(volume);
  }
}

module.exports = ChargeElementContainer;
