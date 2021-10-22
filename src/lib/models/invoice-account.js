'use strict';

const moment = require('moment');
const { sortBy, last, get } = require('lodash');

const { assertAccountNumber, assertIsInstanceOf, assertIsArrayOfType, assertDate, assertNullableDate } = require('./validators');
const Model = require('./model');
const Company = require('./company');
const InvoiceAccountAddress = require('./invoice-account-address');
const DateRange = require('./date-range');

class InvoiceAccount extends Model {
  constructor (id) {
    super(id);
    this._invoiceAccountAddresses = [];
  }

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
      const startDate = get(row, 'dateRange.startDate', undefined);
      return moment(startDate).unix();
    });
    return last(sorted);
  }

  set dateRange (dateRange) {
    assertIsInstanceOf(dateRange, DateRange);
    this._dateRange = dateRange;
  }

  get dateRange () {
    return this._dateRange;
  }

  get dateCreated () {
    return this._dateCreated;
  }

  set dateCreated (date) {
    assertDate(date);
    this._dateCreated = date;
  }

  get dateLastTransactionFileReferenceUpdated () {
    return this._dateLastTransactionFileReferenceUpdated;
  }

  set dateLastTransactionFileReferenceUpdated (inputDate) {
    assertNullableDate(inputDate);
    this._dateLastTransactionFileReferenceUpdated = inputDate;
  }

  get lastTransactionFileReference () {
    return this._lastTransactionFileReference;
  }

  set lastTransactionFileReference (ref) {
    this._lastTransactionFileReference = ref;
  }
}

module.exports = InvoiceAccount;
