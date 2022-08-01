const { isArray, isObject, mapValues } = require('lodash')

/**
 * Stringifies array/object data for writing to DB
 * @param  {Object} data - row data
 * @return {Object}      - row data with arrays/objects stringified
 */
const stringifyValues = data => {
  return mapValues(data, (value, key) => {
    if (isArray(value) || isObject(value)) {
      return JSON.stringify(value)
    }
    return value
  })
}

exports.stringifyValues = stringifyValues
