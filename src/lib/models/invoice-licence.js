'use strict';

const { get } = require('lodash');

const Address = require('./address');
const Company = require('./company');
const Contact = require('./contact-v2');
const Licence = require('./licence');
const Transaction = require('./transaction');
const Role = require('./role');

const {
  assertIsArrayOfType,
  assertIsInstanceOf
} = require('./validators');

const Model = require('./model');

class InvoiceLicence extends Model {
  constructor () {
    super();
    this._transactions = [];
  }

  /**
  * Sets the licence instance
  * @param {Licence} licence
  */
  set licence (licence) {
    assertIsInstanceOf(licence, Licence);
    this._licence = licence;
  }

  /**
   * Gets the licence instance
   * @return {Licence}
   */
  get licence () {
    return this._licence;
  }

  set transactions (transactions) {
    assertIsArrayOfType(transactions, Transaction);
    this._transactions = transactions;
  }

  get transactions () {
    return this._transactions;
  }

  set roles (roles) {
    assertIsArrayOfType(roles, Role);
    this._roles = roles;
  }

  get roles () {
    return this._roles;
  }

  // /**
  //  * Gets a unique ID for this invoice licence which can be used
  //  * for unique comparisons
  //  * @return {String}
  //  */
  // get uniqueId () {
  //   return [
  //     get(this, '_licence.licenceNumber'),
  //     get(this, '_company.id'),
  //     get(this, '_address.id'),
  //     get(this, '_contact.id')
  //   ].join('.');
  // }
}

module.exports = InvoiceLicence;
