'use strict'

const moment = require('moment')
const Model = require('./model')
const { assertLicenceNumber, assertIsInstanceOf, assertDate, assertNullableDate, assertIsArrayOfType } = require('./validators')
const Region = require('./region')
const LicenceAgreement = require('./licence-agreement')

class Licence extends Model {
  set licenceNumber (licenceNumber) {
    assertLicenceNumber(licenceNumber)
    this._licenceNumber = licenceNumber
  }

  get licenceNumber () {
    return this._licenceNumber
  }

  /**
   * Gets the region - 1 of 8 regions related to NALD_SYSTEM_PARAMS
   * @return {Region}
   */
  get region () {
    return this._region
  }

  set region (region) {
    assertIsInstanceOf(region, Region)
    this._region = region
  }

  /**
   * Gets the historical EA area
   * @return {Region}
   */
  get historicalArea () {
    return this._historicalArea
  }

  set historicalArea (region) {
    assertIsInstanceOf(region, Region)
    this._historicalArea = region
  }

  /**
   * Gets the regional charge area
   * @return {Region}
   */
  get regionalChargeArea () {
    return this._regionalChargeArea
  }

  set regionalChargeArea (region) {
    assertIsInstanceOf(region, Region)
    this._regionalChargeArea = region
  }

  /**
   * Gets the start date
   * @return {String}
   */
  get startDate () {
    return this._startDate
  }

  set startDate (startDate) {
    assertDate(startDate)
    this._startDate = startDate
  }

  /**
   * Gets the expired date
   * @return {String|null}
   */
  get expiredDate () {
    return this._expiredDate
  }

  set expiredDate (expiredDate) {
    assertNullableDate(expiredDate)
    this._expiredDate = expiredDate
  }

  /**
   * Gets the lapsed date
   * @return {String|null}
   */
  get lapsedDate () {
    return this._lapsedDate
  }

  set lapsedDate (lapsedDate) {
    assertNullableDate(lapsedDate)
    this._lapsedDate = lapsedDate
  }

  /**
   * Gets the revoked date
   * @return {String|null}
   */
  get revokedDate () {
    return this._revokedDate
  }

  set revokedDate (revokedDate) {
    assertNullableDate(revokedDate)
    this._revokedDate = revokedDate
  }

  /**
   * Gets the end date - the minumum of revoked, lapsed, expired, or null
   * @return {String|null}
   */
  get endDate () {
    const dates = [this.expiredDate, this.lapsedDate, this.revokedDate].filter(x => !!x)
    dates.sort((a, b) => Date.parse(a) - Date.parse(b))
    return dates[0] || null
  }

  /**
   * Checks if licence is future dated
   * @return {Boolean}
   */
  get isFutureDated () {
    return moment(this.startDate).isAfter(moment(), 'day')
  }

  /**
   * Gets validity
   * @return {String}
   */
  get endDateReason () {
    const dates = [
      { key: 'expiredDate', date: this.expiredDate },
      { key: 'lapsedDate', date: this.lapsedDate },
      { key: 'revokedDate', date: this.revokedDate }
    ]
    const sortedDates = dates
      .filter(row => !!row.date)
      .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))

    return sortedDates[0] ? sortedDates[0].key : null
  }

  get isActive () {
    if (this.isFutureDated) {
      return false
    }
    if (!this.endDate) {
      return true
    }
    const now = moment()
    return !moment(this.endDate).isBefore(now, 'day')
  }

  /**
   * Licence agreements
   * @return {Array<LicenceAgreement>}
   */
  get licenceAgreements () {
    return this._licenceAgreements
  }

  set licenceAgreements (licenceAgreements) {
    assertIsArrayOfType(licenceAgreements, LicenceAgreement)
    this._licenceAgreements = licenceAgreements
  }

  toJSON () {
    return {
      ...super.toJSON(),
      isFutureDated: this.isFutureDated,
      endDate: this.endDate,
      endDateReason: this.endDateReason,
      isActive: this.isActive
    }
  }
}

module.exports = Licence
