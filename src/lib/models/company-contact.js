'use strict';

const DateRange = require('./date-range');
const Contact = require('./contact-v2');

const validators = require('./validators');

const Model = require('./model');

const ROLE_NAMES = ['licenceHolder', 'billing'];

class CompanyContact extends Model {
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
   * Sets the contact
   * @param {Contact} contact
   */
  set contact (contact) {
    validators.assertIsInstanceOf(contact, Contact);
    this._contact = contact;
  }

  /**
   * Gets the contact
   * @return {Contact}
   */
  get contact () {
    return this._contact;
  }

  set emailAddress (emailAddress) {
    validators.assertNullableEmailAddress(emailAddress);
    this._emailAddress = emailAddress;
  }

  get emailAddress () {
    return this._emailAddress;
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

module.exports = CompanyContact;
module.exports.ROLE_NAMES = ROLE_NAMES;
