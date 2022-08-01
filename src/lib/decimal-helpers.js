'use strict'

const is = require('@sindresorhus/is')
const Decimal = require('decimal.js-light')

/**
 * Analogous to Math.min, returns the smallest Decimal value
 * @param  {...Decimal} decimals
 * @return {Decimal} the smallest provided decimal
 */
const min = (...decimals) => decimals.reduce(
  (acc, decimal) => decimal.lessThan(acc) ? decimal : acc
)

/**
 * Analogous to Math.max, returns the greatest Decimal value
 * @param  {...Decimal} decimals
 * @return {Decimal} the largest provided decimal
 */
const max = (...decimals) => decimals.reduce(
  (acc, decimal) => decimal.greaterThan(acc) ? decimal : acc
)

/**
 * Checks whether the supplied value is a Decimal
 * @param {*} value
 * @return {Boolean}
 */
const isDecimal = value => is.object(value) && is.directInstanceOf(value, Decimal)

exports.min = min
exports.max = max
exports.isDecimal = isDecimal
