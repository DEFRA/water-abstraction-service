'use strict'

const validators = require('./validators')
const Model = require('./model')
const { CONTACT_ROLES } = require('./constants')

class ContactRole extends Model {
  get name () { return this._name }
  set name (name) {
    validators.assertEnum(name, Object.values(CONTACT_ROLES))
    this._name = name
  }

  get dateCreated () { return this._dateCreated }
  set dateCreated (dateCreated) {
    this._dateCreated = this.getDateTimeFromValue(dateCreated)
  }

  get dateUpdated () { return this._dateUpdated }
  set dateUpdated (dateUpdated) {
    this._dateUpdated = this.getDateTimeFromValue(dateUpdated)
  }
}

module.exports = ContactRole
