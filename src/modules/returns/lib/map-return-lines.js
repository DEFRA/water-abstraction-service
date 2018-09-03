const moment = require('moment');

/**
 * Parses a return ID into constituent variables
 * @param {String} returnId
 * @return {Object}
 */
const parseReturnId = (returnId) => {
  const [ version, regionCode, licenceNumber, formatId, startDate, endDate ] = returnId.split(':');
  return {
    version,
    regionCode,
    licenceNumber,
    formatId,
    startDate,
    endDate
  };
};

const mapPeriod = (str) => {
  const periods = {
    'D': 'day',
    'W': 'week',
    'M': 'month',
    'A': 'year'
  };
  return periods[str];
};

/**
 * Calculates start of period based on start/end date and period
 * @param {String} startDate - the returns start date YYYY-MM-DD
 * @param {String} endDate - the line end date YYYY-MM-DD
 * @param {String} period - the returns period - A/M/W/D
 * @return {String} a date in format YYYY-MM-DD
 */
const getStartDate = (startDate, endDate, period) => {
  const d = moment(endDate, 'YYYY-MM-DD');
  let o;

  if (period === 'year') {
    o = moment(startDate, 'YYYY-MM-DD');
  }
  if (period === 'month') {
    o = d.startOf('month');
  }
  if (period === 'week') {
    o = d.startOf('isoWeek');
  }
  if (period === 'day') {
    o = d;
  }

  return o.format('YYYY-MM-DD');
};

/**
 * Converts units in NALD to recognised SI unit
 * @param {String} unit
 * @return {String} SI unit
 */
const mapUnit = (u) => {
  const units = {
    M: 'm³',
    I: 'gal'
  };
  return units[u] || u;
};

/**
 * Map NALD quantity usability field
 * @param {String} NALD usability flag
 * @return {String} plaintext version
 */
const mapUsability = (u) => {
  const options = {
    E: 'estimate',
    M: 'measured',
    D: 'derived',
    A: 'assessed'
  };
  return options[u];
};

/**
 * Gets quantity from NALD value
 * @param {String} value or 'null' as string
 * @return {Number|Boolean}
 */
const mapQuantity = (value) => {
  return value === '' ? null : parseFloat(value);
};

module.exports = {
  mapPeriod,
  getStartDate,
  mapUnit,
  mapUsability,
  mapQuantity,
  getReturnId
};
