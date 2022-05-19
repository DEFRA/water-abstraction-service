'use strict'

const DateRange = require('./date-range')
const Address = require('./address')
const Company = require('./company')
const Contact = require('./contact-v2')

const validators = require('./validators')

const Model = require('./model')

class InvoiceAccountAddress extends Model {
  /**
   * Valid date range
   * @return {DateRange}
   */
  set dateRange (dateRange) {
    validators.assertIsInstanceOf(dateRange, DateRange)
    this._dateRange = dateRange
  }

  get dateRange () {
    return this._dateRange
  }

  get invoiceAccountId () {
    return this._invoiceAccountId
  }

  set invoiceAccountId (invoiceAccountId) {
    validators.assertId(invoiceAccountId)
    this._invoiceAccountId = invoiceAccountId
  }

  /**
   * Sets the address
   * @param {Address} address
   */
  set address (address) {
    validators.assertIsInstanceOf(address, Address)
    this._address = address
  }

  /**
   * Gets the address
   * @return {Address}
   */
  get address () {
    return this._address
  }

  /**
   * Sets the agent company
   * @param {Company} company
   */
  set agentCompany (company) {
    validators.assertIsNullableInstanceOf(company, Company)
    this._agentCompany = company
  }

  /**
   * Gets the agent company
   * @return {Company}
   */
  get agentCompany () {
    return this._agentCompany
  }

  /**
   * Sets the contact - for FAO
   * @param {Contact} contact
   */
  set contact (contact) {
    validators.assertIsNullableInstanceOf(contact, Contact)
    this._contact = contact
  }

  /**
   * Gets the agent company
   * @return {Contact}
   */
  get contact () {
    return this._contact
  }
}

module.exports = InvoiceAccountAddress
