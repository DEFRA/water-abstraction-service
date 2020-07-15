'use strict';

const moment = require('moment');
const { sortBy, last } = require('lodash');

const { assertAccountNumber, assertIsInstanceOf, assertIsArrayOfType } = require('./validators');
const Model = require('./model');
const Company = require('./company');
const InvoiceAccountAddress = require('./invoice-account-address');

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

  get invoiceAccountAddresses () {
    return this._invoiceAccountAddresses;
  }

  set invoiceAccountAddresses (invoiceAccountAddresses) {
    assertIsArrayOfType(invoiceAccountAddresses, InvoiceAccountAddress);
    this._invoiceAccountAddresses = invoiceAccountAddresses;
  }

  /**
   * Gets the last invoice account address, sorted by start date
   * @return {InvoiceAccountAddress}
   */
  get lastInvoiceAccountAddress () {
    const arr = this.invoiceAccountAddresses || [];
    const sorted = sortBy(arr, row => {
      return moment(row.startDate).unix();
    });
    return last(sorted);
  }
}

module.exports = InvoiceAccount;
