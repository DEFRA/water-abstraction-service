'use strict'

/**
 * Stringifies array/object data for writing to DB
 * @param  {Object} data - row data
 * @return {Object}      - row data with arrays/objects stringified
 */
const stringifyValues = data => {
  const result = {}
  for (const key in data) {
    const value = data[key]
    if (value instanceof Object) {
      result[key] = JSON.stringify(value)
    } else {
      result[key] = value
    }
  }

  return result
}

exports.stringifyValues = stringifyValues
