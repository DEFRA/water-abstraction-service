const moment = require('moment');
const { mapValues, chunk } = require('lodash');
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
 * Given a date, and bounding start/end dates, returns either
 * the input date if within bounds, or the start/end date if out of bounds
 * @param {Object} date - reference date, moment object
 * @param {Object} startDate - moment
 * @param {Object} endDate - moment
 * @retun {Object} moment
 */
const getDateWithinBounds = (date, startDate, endDate) => {
  if (date.isBefore(startDate)) {
    return startDate;
  } else if (date.isAfter(endDate)) {
    return endDate;
  } else {
    return date;
  }
};

/**
 * Given a moment, and isSummer flag, returns a moment for the
 * end date of the next period
 * @param {Object} datePtr - moment
 * @param {Boolean} isSummer
 * @return {Object} moment for end of next period
 */
const getNextPeriodEnd = (datePtr, isSummer) => {
  if (isSummer && datePtr.month() < 10) {
    return moment().year(datePtr.year()).month(9).date(31);
  } else {
    const year = (datePtr.month() <= 2) ? datePtr.year() : datePtr.year() + 1;
    return moment().year(year).month(2).date(31);
  }
};

/**
 * Gets array of cycle dates for the given start date, end date,
 * and summer flag
 * @param {Object} startDate - moment
 * @param {Object} endDate - moment
 * @param {Boolean} isSummer
 * @return {Array} array of start/end date objects
 */
const getCyclePeriods = (startDate, endDate, isSummer) => {
  const dates = [];
  let datePtr = moment(startDate);

  while (datePtr.isSameOrBefore(endDate)) {
    dates.push(getDateWithinBounds(datePtr, startDate, endDate).format('YYYY-MM-DD'));

    datePtr = getNextPeriodEnd(datePtr, isSummer);

    dates.push(getDateWithinBounds(datePtr, startDate, endDate).format('YYYY-MM-DD'));
    datePtr.add(1, 'day');
  }

  return chunk(dates, 2).map(arr => ({
    startDate: arr[0],
    endDate: arr[1]
  }));
};

/**
 * Gets returns cycles given a list of return formats
 * @param {Array} formats
 * @return {array}
 */
const getCycles = (formats) => {
  const cycles = [];

  for (let format of formats) {
    const info = mapProductionMonth(format.FORM_PRODN_MONTH);
    const effStart = moment(format.EFF_ST_DATE, 'DD/MM/YYYY');
    const effEnd = format.EFF_END_DATE === 'null' ? null : moment(format.EFF_END_DATE, 'DD/MM/YYYY');

    const endDate = effEnd || moment();

    const cyclePeriods = getCyclePeriods(effStart, endDate, info.isSummer);

    for (let period in cyclePeriods) {
      cycles.push({
        format,
        info,
        ...period
      });
    }
  }

  return cycles;
};

/**
 * Gets period from the format and log
 * @param {Object} format
 * @param {Object} log
 * @return {Object} start/end dates
 */
const getPeriod = (format, log) => {
  const {
    ABS_PERIOD_ST_DAY: startDay,
    ABS_PERIOD_ST_MONTH: startMonth,
    ABS_PERIOD_END_DAY: endDay,
    ABS_PERIOD_END_MONTH: endMonth
  } = format;

  const startYear = moment(log.DATE_FROM, 'DD/MM/YYYY').year();
  const endYear = endMonth < startMonth ? startYear + 1 : startYear;

  // Need to create/retrieve a return for the specified period
  const startDate = moment().year(startYear).month(startMonth - 1).date(startDay).format('YYYY-MM-DD');
  const endDate = moment().year(endYear).month(endMonth - 1).date(endDay).format('YYYY-MM-DD');

  return {
    startDate,
    endDate
  };
};

module.exports = {
  convertNullStrings,
  mapFrequency,
  mapPeriod,
  getStartDate,
  mapUnit,
  mapUsability,
  getPeriod,
  formatReturnMetadata,
  getCycles,
  getCyclePeriods
};
