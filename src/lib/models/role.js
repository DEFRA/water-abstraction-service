'use strict';

const Model = require('./model');

const Company = require('./company');
const Contact = require('./contact-v2');
const Address = require('./address');

const {
  assertDate,
  assertNullableDate,
  assertEnum,
  assertIsInstanceOf
} = require('./validators');

const ROLE_LICENCE_HOLDER = 'licenceHolder';
const validRoleNames = [ROLE_LICENCE_HOLDER];

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
    assertEnum(roleName, validRoleNames);
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
    assertIsInstanceOf(contact, Contact);
    this._contact = contact;
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
