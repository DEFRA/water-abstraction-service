'use strict';

const DateRange = require('./date-range');
const Address = require('./address');

const validators = require('./validators');

const Model = require('./model');

const ROLE_NAMES = ['licenceHolder', 'billing'];

class CompanyAddress extends Model {
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

  get companyId () {
    return this._companyId;
  }

  set companyId (companyId) {
    validators.assertId(companyId);
    this._companyId = companyId;
  }

  /**
   * Sets the address
   * @param {Address} address
   */
  set address (address) {
    validators.assertIsInstanceOf(address, Address);
    this._address = address;
  }

  /**
   * Gets the address
   * @return {Address}
   */
  get address () {
    return this._address;
  }

  set roleName (roleName) {
    validators.assertEnum(roleName, ROLE_NAMES);
    this._roleName = roleName;
  }

  get roleName () {
    return this._roleName;
  }

  set isDefault (isDefault) {
    validators.assertIsBoolean(isDefault);
    this._isDefault = isDefault;
  }

  get isDefault () {
    return this._isDefault;
  }
}

module.exports = CompanyAddress;
module.exports.ROLE_NAMES = ROLE_NAMES;
