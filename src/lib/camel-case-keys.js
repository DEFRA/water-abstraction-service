'use strict'

const { isPlainObject } = require('lodash')
const { toCamelCase } = require('../lib/object-helpers.js')

const camelCaseObjectKeys = (data) => {
  const result = Object.entries(data).reduce((acc, [key, value]) => {
    acc[toCamelCase(key)] = camelCaseKeys(value)

    return acc
  }, {})
  return result
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
