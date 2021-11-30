'use strict';

const DateRange = require('./date-range');
const Agreement = require('./agreement');

const validators = require('./validators');

const Model = require('./model');

const DATE_FORMAT = 'YYYY-MM-DD';

class LicenceAgreement extends Model {
  set licenceNumber (licenceNumber) {
    validators.assertLicenceNumber(licenceNumber);
    this._licenceNumber = licenceNumber;
  }

  get licenceNumber () {
    return this._licenceNumber;
  }

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

  get dateSigned () {
    return this._dateSigned ? this._dateSigned.format(DATE_FORMAT) : this._dateSigned;
  }

  set dateSigned (dateSigned) {
    this._dateSigned = this.getDateTimeFromValue(dateSigned);
  }

  get dateDeleted () {
    return this._dateDeleted ? this._dateDeleted.format(DATE_FORMAT) : this._dateDeleted;
  }

  set dateDeleted (dateDeleted) {
    this._dateDeleted = this.getDateTimeFromValue(dateDeleted);
  }
}

module.exports = LicenceAgreement;
