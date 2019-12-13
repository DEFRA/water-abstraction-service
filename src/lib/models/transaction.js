'use strict';

const { pick } = require('lodash');

const Model = require('./model');
const { assertIsBoolean } = require('./validators');

class Transaction extends Model {
  constructor (id, value, isCredit = false) {
    super(id);
    this.value = value;
    this.isCredit = isCredit;
  }

  /**
   * Extracts a subset of the ChargeModuleTransaction object data and returns
   * a Transaction model
   * @param {ChargeModuleTransaction} chargeModuleTransaction The source data
   */
  static fromChargeModuleTransaction (chargeModuleTransaction) {
    const transaction = new Transaction();
    transaction.fromHash(pick(chargeModuleTransaction, ['value', 'isCredit']));
    return transaction;
  }

  get value () {
    return this._value;
  }

  set value (value) {
    this._value = value;
  }

  get isCredit () {
    return this._isCredit;
  }

  set isCredit (isCredit) {
    assertIsBoolean(isCredit);
    this._isCredit = isCredit;
  }
}

module.exports = Transaction;
