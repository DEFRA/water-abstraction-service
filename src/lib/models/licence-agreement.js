'use strict';

const DateRange = require('./date-range');
const Agreement = require('./agreement');

const validators = require('./validators');

const Model = require('./model');

class LicenceAgreement extends Model {
  /**
   * Valid date range
   * @return {DateRange}
   */
  set dateRange (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange);
    this._dateRange = dateRange;
  }

  get dateRange () {
    return this._dateRange;
  }

  /**
   * Agreement
   * @return {Agreement}
   */
  get agreement () {
    return this._agreement;
  }

  set agreement (agreement) {
    validators.assertIsInstanceOf(agreement, Agreement);
    this._agreement = agreement;
  }
}

module.exports = LicenceAgreement;
