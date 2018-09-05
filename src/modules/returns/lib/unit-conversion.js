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

module.exports = {
  convertToCubicMetres
};
