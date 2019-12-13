'use strict';

const { assertAccountNumber } = require('./validators');
const Model = require('./model');

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
}

module.exports = InvoiceAccount;
