'use strict'

const validators = require('./validators')

const Model = require('./model')
const LicenceVersionPurpose = require('./licence-version-purpose')

const LICENCE_VERSION_STATUS = {
  draft: 'draft',
  current: 'current',
  superseded: 'superseded'
}

class LicenceVersion extends Model {
  get licenceId () { return this._licenceId }
  set licenceId (licenceId) {
    validators.assertId(licenceId)
    this._licenceId = licenceId
  }

  get issue () { return this._issue }
  set issue (issue) {
    validators.assertInteger(issue)
    this._issue = issue
  }

  get increment () { return this._increment }
  set increment (increment) {
    validators.assertInteger(increment)
    this._increment = increment
  }

  get status () { return this._status }
  set status (status) {
    validators.assertEnum(status, Object.values(LICENCE_VERSION_STATUS))
    this._status = status
  }

  get startDate () { return this._startDate }
  set startDate (startDate) {
    this._startDate = this.getDateOrThrow(startDate, 'Start date')
  }

  get endDate () { return this._endDate }
  set endDate (endDate) {
    const date = this.getDateTimeFromValue(endDate)
    this._endDate = date
  }

  get externalId () { return this._externalId }
  set externalId (externalId) {
    validators.assertString(externalId)
    this._externalId = externalId
  }

  get dateCreated () { return this._dateCreated }
  set dateCreated (dateCreated) {
    this._dateCreated = this.getDateOrThrow(dateCreated, 'Date created')
  }

  get dateUpdated () { return this._dateUpdated }
  set dateUpdated (dateUpdated) {
    this._dateUpdated = this.getDateOrThrow(dateUpdated, 'Date updated')
  }

  get licenceVersionPurposes () { return this._licenceVersionPurposes }
  set licenceVersionPurposes (licenceVersionPurposes) {
    validators.assertIsArrayOfType(licenceVersionPurposes, LicenceVersionPurpose)
    this._licenceVersionPurposes = licenceVersionPurposes
  }
}

module.exports = LicenceVersion
