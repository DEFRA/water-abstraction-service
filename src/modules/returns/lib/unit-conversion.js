class InvalidUnitError extends Error {
  constructor (...args) {
    super(...args);
    Error.captureStackTrace(this, InvalidUnitError);
  }
}

/**
 * Convert value to cubic metres
 * @param {Number} value - the value to convert
 * @param {String} unit - the user units
 * @return {Number} value in cubic metres
 */
const convertToCubicMetres = (value, unit) => {
  if (value === null) {
    return null;
  }
  if (unit === 'm³') {
    return value;
  }
  if (unit === 'l') {
    return value / 1000;
  }
  if (unit === 'Ml') {
    return value * 1000;
  }
  if (unit === 'gal') {
    return value * 0.00454609;
  }
  throw new InvalidUnitError(`Unknown unit ${unit}`);
};

/**
 * Convert value from cubic metres back to supplied user unit
 * @param {Number} value - the quantity abstracted
 * @return {String} unit
 * @return {Number} quantity in user-selected units
 */
const convertToUserUnit = (value, unit) => {
  if (value === null) {
    return null;
  }
  if (unit === 'm³') {
    return value;
  }
  if (unit === 'l') {
    return value * 1000;
  }
  if (unit === 'Ml') {
    return value / 1000;
  }
  if (unit === 'gal') {
    return value * 219.969248299;
  }
  throw new InvalidUnitError(`Unknown unit ${unit}`);
};

module.exports = {
  convertToCubicMetres,
  convertToUserUnit,
  InvalidUnitError
};
