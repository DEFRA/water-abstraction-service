'use strict';

const Model = require('./model');
const { assertLicenceNumber, assertIsInstanceOf } = require('./validators');
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
}

module.exports = Licence;
