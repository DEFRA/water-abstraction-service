'use strict'

const { isObject } = require('lodash')

const { assertId } = require('./validators')
const { getDateTimeFromValue } = require('../dates')

class Model {
  constructor (id) {
    if (id) {
      this.id = id
    }
  }

  get id () {
    return this._id
  }

  set id (id) {
    assertId(id)
    this._id = id
  }

  fromHash (valueHash) {
    for (const key in valueHash) {
      this[key] = valueHash[key]
    }
    return this
  };

  pickFrom (source, keys) {
    if (!source || !keys) return
    const picked = {}
    for (const key of keys) {
      if (source[key] !== undefined) {
        picked[key] = source[key]
      }
    }

    this.fromHash(picked)

    return this
  }

  /**
   * Creates an object containing the key values pairs requested.
   *
   * @param  {...String} keys The keys to extract from this instance
   */
  pick (...args) {
    let keys
    const picked = {}

    if (Array.isArray(args[0])) {
      keys = args[0]
    } else {
      keys = args
    }

    for (const key of keys) {
      if (this[key] !== undefined) {
        picked[key] = this[key]
      }
    }

    return picked
  }

  toJSON () {
    return Object.keys(this).reduce((acc, key) => {
      const externalKey = key.replace('_', '')
      const value = this[externalKey]
      acc[externalKey] = isObject(value) && value.toJSON ? value.toJSON() : value
      return acc
    }, {})
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
    return getDateTimeFromValue(value)
  };

  getDateOrThrow (date, friendlyName) {
    const momentDate = this.getDateTimeFromValue(date)

    if (momentDate === null) {
      throw new Error(`${friendlyName} cannot be null`)
    }

    return momentDate
  };

  /**
   * Clears the .id property of this model.
   * This can be useful if you wish to clone a model but omit the ID so that
   * a fresh copy can be persisted to the database.
   *
   * @example const cloneModel = new Model().fromHash(sourceModel).clearId();
   */
  clearId () {
    delete this._id
    return this
  }
}

module.exports = Model
