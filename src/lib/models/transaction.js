'use strict';

const Joi = require('joi');

class Transaction {
  constructor (id, value, isCredit = false) {
    this.id = id;
    this.value = value;
    this.isCredit = isCredit;
  }

  get id () {
    return this._id;
  }

  set id (id) {
    this._id = id;
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
    Joi.assert(isCredit, Joi.boolean());
    this._isCredit = isCredit;
  }

  toJSON () {
    return {
      id: this.id,
      value: this.value,
      isCredit: this.isCredit
    };
  }
}

module.exports = Transaction;
