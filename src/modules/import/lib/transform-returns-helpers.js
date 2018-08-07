const moment = require('moment');
const { mapValues, chunk, uniqBy } = require('lodash');
const { formatAbstractionPoint } = require('../../../lib/licence-transformer/nald-helpers');

/**
 * Converts 'null' strings to real null in supplied object
 * @param {Object} - plain object
 * @return {Object} with 'null' values converted to 'null'
 */
const convertNullStrings = (obj) => {
  return mapValues(obj, val => val === 'null' ? null : val);
};

const mapFrequency = (str) => {
  const frequencies = {
    'D': 'daily',
    'W': 'weekly',
    'M': 'monthly',
    'A': 'annual'
  };
  return frequencies[str];
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
 * @param {String} startDate - the returns start date YYYYMMDD
 * @param {String} endDate - the line end date YYYYMMDD
 * @param {String} period - the returns period - A/M/W/D
 * @return {String} a date in format YYYY-MM-DD
 */
const getStartDate = (startDate, endDate, period) => {
  const d = moment(endDate, 'YYYYMMDD');
  let o;

  if (period === 'A') {
    o = moment(startDate, 'YYYYMMDD');
  }
  if (period === 'M') {
    o = d.startOf('month');
  }
  if (period === 'W') {
    o = d.startOf('isoWeek');
  }
  if (period === 'D') {
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
 * Gets additional NALD data to store in return metadata
 * @param {Object} format - the return format record from NALD data
 * @return {Object} metadata to store
 */
const formatReturnNaldMetadata = (format) => {
  return {
    regionCode: parseInt(format.FGAC_REGION_CODE),
    formatId: parseInt(format.ID),
    // dateFrom: dateToIsoString(log.DATE_FROM),
    // dateTo: dateToIsoString(log.DATE_TO),
    // dateReceived: dateToIsoString(log.RECD_DATE),
    periodStartDay: format.ABS_PERIOD_ST_DAY,
    periodStartMonth: format.ABS_PERIOD_ST_MONTH,
    periodEndDay: format.ABS_PERIOD_END_DAY,
    periodEndMonth: format.ABS_PERIOD_END_MONTH
    // underQuery: log.UNDER_QUERY_FLAG === 'Y'
  };
};

/**
 * Gets metadata object to store in returns table
 * @param {Object} format
 * @return {Object} return metadata
 */
const formatReturnMetadata = (format) => {
  return {
    version: 1,
    description: format.SITE_DESCR,
    purposes: format.purposes.map(purpose => ({
      primary: {
        code: purpose.APUR_APPR_CODE,
        description: purpose.primary_purpose
      },
      secondary: {
        code: purpose.APUR_APSE_CODE,
        description: purpose.secondary_purpose
      },
      tertiary: {
        code: purpose.APUR_APUS_CODE,
        description: purpose.tertiary_purpose
      }
    })),
    points: format.points.map(point => formatAbstractionPoint(convertNullStrings(point))),
    nald: formatReturnNaldMetadata(format)
  };
};

/**
 * Maps NALD production month
 * @param {Number} month
 * @return {Object}
 */
const mapProductionMonth = (month) => {
  const intMonth = parseInt(month);
  return {
    isSummer: [65, 45, 80].includes(intMonth),
    isUpload: [65, 66].includes(intMonth),
    isLineEntry: [45, 46].includes(intMonth),
    formProduced: [80, 70].includes(intMonth)
  };
};

/**
 * Gets financial year period for given date
 * @param {String} date - DD/MM/YYYY
 * @return {Object}
 */
const getFinancialYear = (date) => {
  const m = moment(date, 'DD/MM/YYYY');
  const comparison = moment().year(m.year()).month(3).date(1);
  const startYear = m.isBefore(comparison, 'day') ? m.year() - 1 : m.year();
  return {
    startDate: `${startYear}-04-01`,
    endDate: `${startYear + 1}-03-31`
  };
};

/**
 * Gets financial year period for given date
 * @param {String} date - DD/MM/YYYY
 * @return {Object}
 */
const getSummerYear = (date) => {
  const m = moment(date, 'DD/MM/YYYY');
  const comparison = moment().year(m.year()).month(10).date(1);
  const startYear = m.isBefore(comparison, 'day') ? m.year() - 1 : m.year();
  return {
    startDate: `${startYear}-11-01`,
    endDate: `${startYear + 1}-10-31`
  };
};

/**
 * Gets the returns cycles for the given format.
 * Depending on the FORM_PRODN_MONTH flag, this will either be financial years
 * or years running 1 Nov - 31 Oct
 * @param {Object} format
 * @return {Array} array of cycles
 */
const getFormatCycles = (format) => {
  const cycles = [];

  const info = mapProductionMonth(format.FORM_PRODN_MONTH);

  const dateFunc = info.isSummer ? getSummerYear : getFinancialYear;

  for (let log of format.logs) {
    const { DATE_FROM: dateFrom, DATE_TO: dateTo } = log;

    cycles.push(dateFunc(dateFrom));
    cycles.push(dateFunc(dateTo));
  }

  return uniqBy(cycles, row => row.startDate);
};

module.exports = {
  convertNullStrings,
  mapFrequency,
  mapPeriod,
  getStartDate,
  mapUnit,
  mapUsability,
  mapProductionMonth,
  // getPeriod,
  formatReturnMetadata,
  // getCycles,
  // getCyclePeriods,
  getFinancialYear,
  getSummerYear,
  getFormatCycles
};
