'use strict'

const { reduce, isPlainObject } = require('lodash')

/* This regex is converting any string into Camel Case
 * [^a-zA-Z0-9] is matching any character except those inside the square brackets.
 * This could be a dash (-), space ( ), or underscore (_)
 * +(.) is matching the first character after the dash, space or underscore.
 * /g. Replaces all the global matches and not just the first match, so the whole string can be converted
*/
const toCamelCase = (key) => {
  return key.replace(/[^a-zA-Z0-9]+(.)/g, (match, char) => char.toUpperCase())
}

const camelCaseObjectKeys = (data) => {
  return reduce(data, (acc, value, key) => {
    acc[toCamelCase(key)] = camelCaseKeys(value)

    return acc
  }, {})
}

/**
 * Camel cases the keys of an object, or an array of objects.
 * @param {Array|Object} data The array of objects, or object that is to
 * have it's keys camel cased
 */
const camelCaseKeys = (data) => {
  if (Array.isArray(data)) {
    return data.map(camelCaseKeys)
  }

  if (isPlainObject(data)) {
    return camelCaseObjectKeys(data)
  }

  return data
}

module.exports = camelCaseKeys
