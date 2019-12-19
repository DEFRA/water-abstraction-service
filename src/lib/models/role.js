'use strict';

const Model = require('./model');

const Company = require('./company');
const Contact = require('./contact-v2');
const Address = require('./address');

const {
  assertDate,
  assertNullableDate,
  assertRoleName,
  assertIsInstanceOf
} = require('./validators');

class Role extends Model {
  set startDate (startDate) {
    assertDate(startDate);
    this._startDate = startDate;
  }

  get startDate () {
    return this._startDate;
  }

  set endDate (endDate) {
    assertNullableDate(endDate);
    this._endDate = endDate;
  }

  get endDate () {
    return this._endDate;
  }

  set roleName (roleName) {
    assertRoleName(roleName);
    this._roleName = roleName;
  }

  get roleName () {
    return this._roleName;
  }

  set company (company) {
    assertIsInstanceOf(company, Company);
    this._company = company;
  }

  get company () {
    return this._company;
  }

  set contact (contact) {
    if (contact) {
      assertIsInstanceOf(contact, Contact);
      this._contact = contact;
    } else { this._contact = null; }
  }

  get contact () {
    return this._contact;
  }

  set address (address) {
    assertIsInstanceOf(address, Address);
    this._address = address;
  }

  get address () {
    return this._address;
  }
}

module.exports = Role;
