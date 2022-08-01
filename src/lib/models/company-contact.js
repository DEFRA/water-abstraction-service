'use strict'

const validators = require('./validators')
const Model = require('./model')
const Contact = require('./contact-v2')
const ContactRole = require('./contact-role')
const DateRange = require('./date-range')

class CompanyContact extends Model {
  get companyId () { return this._companyId }
  set companyId (companyId) {
    validators.assertId(companyId)
    this._companyId = companyId
  }

  get roleId () { return this._roleId }
  set roleId (roleId) {
    validators.assertId(roleId)
    this._roleId = roleId
  }

  get isDefault () { return this._isDefault }
  set isDefault (isDefault) {
    validators.assertIsBoolean(isDefault)
    this._isDefault = isDefault
  }

  get dateRange () { return this._dateRange }
  set dateRange (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange)
    this._dateRange = dateRange
  }

  get dateCreated () { return this._dateCreated }
  set dateCreated (dateCreated) {
    this._dateCreated = this.getDateTimeFromValue(dateCreated)
  }

  get dateUpdated () { return this._dateUpdated }
  set dateUpdated (dateUpdated) {
    this._dateUpdated = this.getDateTimeFromValue(dateUpdated)
  }

  get contact () { return this._contact }
  set contact (contact) {
    validators.assertIsNullableInstanceOf(contact, Contact)
    this._contact = contact
  }

  get role () { return this._role }
  set role (role) {
    validators.assertIsNullableInstanceOf(role, ContactRole)
    this._role = role
  }
}

module.exports = CompanyContact
