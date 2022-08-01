'use strict'

const validators = require('./validators')
const AbstractionPeriod = require('./abstraction-period')
const DateRange = require('./date-range')
const PurposeUse = require('./purpose-use')
const Purpose = require('./purpose')

const Model = require('./model')

class LicenceVersionPurpose extends Model {
  get licenceId () { return this._licenceId }
  set licenceId (licenceId) {
    validators.assertId(licenceId)
    this._licenceId = licenceId
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

  get abstractionPeriod () { return this._abstractionPeriod }
  set abstractionPeriod (abstractionPeriod) {
    validators.assertIsInstanceOf(abstractionPeriod, AbstractionPeriod)
    this._abstractionPeriod = abstractionPeriod
  }

  get timeLimitedPeriod () { return this._timeLimitedPeriod }
  set timeLimitedPeriod (dateRange) {
    if (dateRange !== null) {
      validators.assertIsInstanceOf(dateRange, DateRange)
    }
    this._timeLimitedPeriod = dateRange
  }

  get annualQuantity () { return this._annualQuantity }
  set annualQuantity (annualQuantity) {
    validators.assertNullableQuantity(annualQuantity)
    this._annualQuantity = annualQuantity
  }

  get notes () { return this._notes }
  set notes (notes) {
    validators.assertNullableString(notes)
    this._notes = notes
  }

  get purposePrimary () { return this._purposePrimary }
  set purposePrimary (purposePrimary) {
    validators.assertIsInstanceOf(purposePrimary, Purpose)
    this._purposePrimary = purposePrimary
  }

  get purposeSecondary () { return this._purposeSecondary }
  set purposeSecondary (purposeSecondary) {
    validators.assertIsInstanceOf(purposeSecondary, Purpose)
    this._purposeSecondary = purposeSecondary
  }

  get purposeUse () { return this._purposeUse }
  set purposeUse (purposeUse) {
    validators.assertIsInstanceOf(purposeUse, PurposeUse)
    this._purposeUse = purposeUse
  }
}

module.exports = LicenceVersionPurpose
