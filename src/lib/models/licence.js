'use strict';

const Model = require('./model');
const { assertLicenceNumber, assertIsInstanceOf, assertDate, assertNullableDate } = require('./validators');
const Region = require('./region');

class Licence extends Model {
  set licenceNumber (licenceNumber) {
    assertLicenceNumber(licenceNumber);
    this._licenceNumber = licenceNumber;
  }

  get licenceNumber () {
    return this._licenceNumber;
  }

  /**
   * Gets the region - 1 of 8 regions related to NALD_SYSTEM_PARAMS
   * @return {Region}
   */
  get region () {
    return this._region;
  }

  set region (region) {
    assertIsInstanceOf(region, Region);
    this._region = region;
  }

  /**
   * Gets the historical EA area
   * @return {Region}
   */
  get historicalArea () {
    return this._historicalArea;
  }

  set historicalArea (region) {
    assertIsInstanceOf(region, Region);
    this._historicalArea = region;
  }

  /**
   * Gets the regional charge area
   * @return {Region}
   */
  get regionalChargeArea () {
    return this._regionalChargeArea;
  }

  set regionalChargeArea (region) {
    assertIsInstanceOf(region, Region);
    this._regionalChargeArea = region;
  }

  /**
   * Gets the start date
   * @return {String}
   */
  get startDate () {
    return this._startDate;
  }

  set startDate (startDate) {
    assertDate(startDate);
    this._startDate = startDate;
  }

  /**
   * Gets the expired date
   * @return {String|null}
   */
  get expiredDate () {
    return this._expiredDate;
  }

  set expiredDate (expiredDate) {
    assertNullableDate(expiredDate);
    this._expiredDate = expiredDate;
  }

  /**
   * Gets the lapsed date
   * @return {String|null}
   */
  get lapsedDate () {
    return this._lapsedDate;
  }

  set lapsedDate (lapsedDate) {
    assertNullableDate(lapsedDate);
    this._lapsedDate = lapsedDate;
  }

  /**
   * Gets the revoked date
   * @return {String|null}
   */
  get revokedDate () {
    return this._revokedDate;
  }

  set revokedDate (revokedDate) {
    assertNullableDate(revokedDate);
    this._revokedDate = revokedDate;
  }
}

module.exports = Licence;
