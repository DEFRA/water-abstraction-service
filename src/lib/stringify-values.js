'use strict'

const { mapValues } = require('lodash')

/**
 * Stringifies array/object data for writing to DB
 * @param  {Object} data - row data
 * @return {Object}      - row data with arrays/objects stringified
 */
const stringifyValues = data => {
  const result = mapValues(data, (value, key) => {
    if (value instanceof Object) {
      return JSON.stringify(value)
    }
    return value
  })

  return result
}

exports.stringifyValues = stringifyValues
