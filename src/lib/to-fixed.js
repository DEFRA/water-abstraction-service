'use strict';

/**
 * Rounds the number to the specified precision
 * Defaults to 3DP if not specified
 * @param {Number} number
 * @param {Integer} [precision] - default 3 DP
 */
const toFixedPrecision = (number, precision = 3) => parseFloat(number.toFixed(precision));

module.exports = toFixedPrecision;
