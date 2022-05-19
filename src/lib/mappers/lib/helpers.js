'use strict'
const { chunk } = require('lodash')

/**
 * Function for combining address lines, when/if necessary
 * Used by Notify.js and by the charge module customer update mapper
 * @param lines The address lines
 * @param maxNumberOfLines
 * @returns {*[]}
 */
const combineAddressLines = (lines, maxNumberOfLines = 7) => {
  const minimum = (num, min) =>
    num < min ? min : num

  const over = minimum(lines.length - maxNumberOfLines, 0)

  const groupedLines = chunk(lines, 2).map(arr => arr.join(', '))

  return [
    ...groupedLines.slice(0, over),
    ...lines.slice(over * 2)
  ]
}

/**
 * Function for taking a combined address array and turning it into a Pojo
 * @param arr
 * @returns {*}
 */
const getAddressObjectFromArray = (arr, prefix = 'address_line_') => arr.reduce((acc, line, index) => ({
  ...acc,
  [`${prefix}${index + 1}`]: line
}), {})

/**
 * Convenience function to create a new service model of the supplied class,
 * using the data mapped via the supplied mapper.
 * The mapper is an instance of the map-factory NPM module
 * @param {Class} ModelClass
 * @param {Object} data
 * @param {Object} mapper
 * @return {Object}
 */
const createModel = (ModelClass, data, mapper) => {
  const model = new ModelClass()
  return model.fromHash(
    mapper.execute(data)
  )
}

exports.createModel = createModel
exports.combineAddressLines = combineAddressLines
exports.getAddressObjectFromArray = getAddressObjectFromArray
