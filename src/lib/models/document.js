'use strict'

/**
 * @module water service representation of CRM v2 document model
 */
const Model = require('./model')
const DateRange = require('./date-range')
const validators = require('./validators')
const Role = require('./role')

const DOCUMENT_STATUS = {
  current: 'current',
  draft: 'draft',
  superseded: 'superseded'
}

class Document extends Model {
  constructor (id) {
    super(id)
    this._roles = []
  }

  /**
   * Date range of document
   * @param {DateRange} dateRange
   */
  set dateRange (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange)
    this._dateRange = dateRange
  }

  get dateRange () {
    return this._dateRange
  }

  /**
   * Sets the docuement status
   * @param {String} status
   */
  set status (status) {
    validators.assertEnum(status, Object.keys(DOCUMENT_STATUS))
    this._status = status
  }

  get status () {
    return this._status
  }

  /**
   * Version number
   * @param {Number}
   */
  set versionNumber (versionNumber) {
    validators.assertPositiveInteger(versionNumber)
    this._versionNumber = versionNumber
  }

  get versionNumber () {
    return this._versionNumber
  }

  /**
   * Roles
   * @param {Array<Role>} roles
   */
  set roles (roles) {
    validators.assertIsArrayOfType(roles, Role)
    this._roles = roles
  }

  get roles () {
    return this._roles
  }

  /**
   * Gets the role with the specified role name on the specified date
   * @param {String} roleName
   * @param {String} date
   * @return {Role}
   */
  getRoleOnDate (roleName, date) {
    validators.assertEnum(roleName, Object.values(Role.ROLE_NAMES))
    const [role] = this.roles.filter(
      role => role.roleName === roleName && role.dateRange.includes(date)
    )
    return role
  }

  /**
   * Licence number
   * @param {Number}
   */
  set licenceNumber (licenceNumber) {
    validators.assertLicenceNumber(licenceNumber)
    this._licenceNumber = licenceNumber
  }

  get licenceNumber () {
    return this._licenceNumber
  }
}

module.exports = Document
module.exports.DOCUMENT_STATUS = DOCUMENT_STATUS
