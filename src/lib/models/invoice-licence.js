'use strict'
const Licence = require('./licence')
const Transaction = require('./transaction')
const Role = require('./role')

const {
  assertIsArrayOfType,
  assertIsInstanceOf,
  assertId
} = require('./validators')

const Model = require('./model')

class InvoiceLicence extends Model {
  constructor (id) {
    super(id)
    this._transactions = []
  }

  /**
  * Sets the licence instance
  * @param {Licence} licence
  */
  set licence (licence) {
    assertIsInstanceOf(licence, Licence)
    this._licence = licence
  }

  /**
   * Gets the licence instance
   * @return {Licence}
   */
  get licence () {
    return this._licence
  }

  set transactions (transactions) {
    assertIsArrayOfType(transactions, Transaction)
    this._transactions = transactions
  }

  get transactions () {
    return this._transactions
  }

  set roles (roles) {
    assertIsArrayOfType(roles, Role)
    this._roles = roles
  }

  get roles () {
    return this._roles
  }

  /**
   * Parent invoice ID
   * @param {String} invoiceId - GUID
   */
  set invoiceId (invoiceId) {
    assertId(invoiceId)
    this._invoiceId = invoiceId
  }

  get invoiceId () {
    return this._invoiceId
  }

  get hasTransactionErrors () {
    return this.transactions.some(transaction => transaction.isErrorStatus)
  }

  toJSON () {
    const { hasTransactionErrors } = this
    return {
      hasTransactionErrors,
      ...super.toJSON()
    }
  }
}

module.exports = InvoiceLicence
