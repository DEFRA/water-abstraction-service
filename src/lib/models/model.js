'use strict';

const { pick, isString, isObject } = require('lodash');
const moment = require('moment');

const { assertId, assertIsoString } = require('./validators');

class Model {
  constructor (id) {
    if (id) {
      this.id = id;
    }
  }

  get id () {
    return this._id;
  }

  set id (id) {
    assertId(id);
    this._id = id;
  }

  fromHash (valueHash) {
    for (const key in valueHash) {
      this[key] = valueHash[key];
    }
  };

  pickFrom (source, keys) {
    this.fromHash(pick(source, keys));
  }

  toJSON () {
    return Object.keys(this).reduce((acc, key) => {
      const value = this[key];
      acc[key.replace('_', '')] = isObject(value) && value.toJSON ? value.toJSON() : value;
      return acc;
    }, {});
  }

  /**
   * Helper for setting date time values. Will handle null, ISO strings, JS Dates or
   * moment objects representing a date with time.
   *
   * Throws errors if the value does not meet the above criteria, otherwise returns
   * the moment value of the input.
   *
   * @param {null|String|Date|moment} value The value to validate and return as a moment
   */
  getDateTimeFromValue (value) {
    if (value === null || moment.isMoment(value)) {
      return value;
    }

    if (isString(value)) {
      assertIsoString(value);
      return moment(value);
    }

    if (moment.isDate(value)) {
      return moment(value);
    }

    throw new Error('Unexpected type for date input. Requires null, ISO string, date or moment');
  };
}

module.exports = Model;
