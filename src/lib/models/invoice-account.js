'use strict';

const { assertAccountNumber, assertIsInstanceOf } = require('./validators');
const Model = require('./model');
const Company = require('./company');

class InvoiceAccount extends Model {
  /**
   * Sets the invoice account number
   * Must be in the form [region letter]01234567A
   * @param {String} accountNumber
   */
  set accountNumber (accountNumber) {
    assertAccountNumber(accountNumber);
    this._accountNumber = accountNumber;
  }

  /**
   * Gets the invoice account number
   * @return {String}
   */
  get accountNumber () {
    return this._accountNumber;
  }

  /**
  * Sets the account company
  * @param {Company} company
  */
  set company (company) {
    assertIsInstanceOf(company, Company);
    this._company = company;
  }

  /**
 * Gets the company
 * @return {Company}
 */
  get company () {
    return this._company;
  }
}

module.exports = InvoiceAccount;
