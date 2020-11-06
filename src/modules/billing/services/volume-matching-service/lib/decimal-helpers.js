'use strict';

/**
 * Analogous to Math.min, returns the smallest Decimal value
 * @param  {...Decimal} decimals
 * @return {Decimal} the smallest provided decimal
 */
const min = (...decimals) => decimals.reduce((acc, decimal) => {
  return decimal.lessThan(acc) ? decimal : acc;
});

/**
 * Analogous to Math.min, returns the smallest Decimal value
 * @param  {...Decimal} decimals
 * @return {Decimal} the largest provided decimal
 */
const max = (...decimals) => decimals.reduce((acc, decimal) => {
  return decimal.greaterThan(acc) ? decimal : acc;
});

exports.min = min;
exports.max = max;
