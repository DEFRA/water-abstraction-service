'use strict';

const validators = require('./validators');
const Model = require('./model');
const Contact = require('./contact-v2');
const Role = require('./role-v2');

class CompanyContact extends Model {
  get companyId () { return this._companyId; }
  set companyId (companyId) {
    validators.assertId(companyId);
    this._companyId = companyId;
  }

  get contactId () { return this._contactId; }
  set contactId (contactId) {
    validators.assertId(contactId);
    this._contactId = contactId;
  }

  get roleId () { return this._roleId; }
  set roleId (roleId) {
    validators.assertId(roleId);
    this._roleId = roleId;
  }

  get isDefault () { return this._isDefault; }
  set isDefault (isDefault) {
    validators.assertIsBoolean(isDefault);
    this._isDefault = isDefault;
  }

  get startDate () { return this._startDate; }
  set startDate (startDate) {
    this._startDate = this.getDateOrThrow(startDate);
  }

  get endDate () { return this._endDate; }
  set endDate (endDate) {
    this._endDate = this.getDateTimeFromValue(endDate);
  }

  get dateCreated () { return this._dateCreated; }
  set dateCreated (dateCreated) {
    this._dateCreated = this.getDateTimeFromValue(dateCreated);
  }

  get dateUpdated () { return this._dateUpdated; }
  set dateUpdated (dateUpdated) {
    this._dateUpdated = this.getDateTimeFromValue(dateUpdated);
  }

  get contact () { return this._contact; }
  set contact (contact) {
    if (contact !== null) {
      validators.assertIsNullableInstanceOf(contact, Contact);
    }
    this._contact = contact;
  }

  get role () { return this._role; }
  set role (role) {
    if (role != null) {
      validators.assertIsNullableInstanceOf(role, Role);
    }
    this._role = role;
  }
}

module.exports = CompanyContact;
