class InvalidUnitError extends Error {
  constructor (...args) {
    super(...args);
    Error.captureStackTrace(this, InvalidUnitError);
  }
}

/**
 * Generic unit converter
 * @param {Number} value
 * @param {String} unit
 * @param {Object} multiplers - key/value hash
 * @return {Number|null} converted value
 */
const converter = (value, unit, multipliers) => {
  if (value === null) {
    return null;
  }

  if (unit in multipliers) {
    return value * multipliers[unit];
  }

  throw new InvalidUnitError(`Unknown unit ${unit}`);
};

/**
 * Convert value to cubic metres
 * @param {Number} value - the value to convert
 * @param {String} unit - the user units
 * @return {Number} value in cubic metres
 */
const convertToCubicMetres = (value, unit) => {
  const multipliers = {
    'm³': 1,
    'l': 0.001,
    'Ml': 1000,
    'gal': 0.00454609
  };

  return converter(value, unit, multipliers);
};

/**
 * Convert value from cubic metres back to supplied user unit
 * @param {Number} value - the quantity abstracted
 * @return {String} unit
 * @return {Number} quantity in user-selected units
 */
const convertToUserUnit = (value, unit) => {
  const multipliers = {
    'm³': 1,
    'l': 1000,
    'Ml': 0.001,
    'gal': 219.969248299
  };

  return converter(value, unit, multipliers);
};

module.exports = {
  convertToCubicMetres,
  convertToUserUnit,
  InvalidUnitError
};
