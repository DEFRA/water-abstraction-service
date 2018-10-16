const moment = require('moment');
const { findIndex, max, mapValues, chunk } = require('lodash');
const { formatAbstractionPoint } = require('../../../lib/licence-transformer/nald-helpers');

/**
 * Converts 'null' strings to real null in supplied object
 * @param {Object} - plain object
 * @return {Object} with 'null' values converted to 'null'
 */
const convertNullStrings = (obj) => {
  return mapValues(obj, val => val === 'null' ? null : val);
};

const mapPeriod = (str) => {
  const periods = {
    'D': 'day',
    'W': 'week',
    'M': 'month',
    'Q': 'quarter',
    'A': 'year'
  };
  return periods[str];
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
    periodStartDay: format.ABS_PERIOD_ST_DAY,
    periodStartMonth: format.ABS_PERIOD_ST_MONTH,
    periodEndDay: format.ABS_PERIOD_END_DAY,
    periodEndMonth: format.ABS_PERIOD_END_MONTH
  };
};

/**
 * Returns the trimmed purpose alias if it is not
 * already empty or equal to 'null'
 */
const getPurposeAlias = purpose => {
  const alias = (purpose.PURP_ALIAS || '').trim();

  if (!['', 'null'].includes(alias.toLowerCase())) {
    return alias;
  }
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
      },
      alias: getPurposeAlias(purpose)
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
 * A return may comprise more than one form log
 * If any form log has not been received, we return null
 * If there are no form log, return null
 * otherwise return max received last date
 * @param {Array} logs - form log records
 */
const mapReceivedDate = (logs) => {
  const dates = logs.map(row => row.RECD_DATE);

  if (logs.length < 1) {
    return null;
  }

  if (findIndex(dates, val => val === 'null') !== -1) {
    return null;
  }

  const timestamps = dates.map(date => moment(date, 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD'));

  return max(timestamps);
};

/**
 * Gets a return ID for the specified licence/format and dates
 * @param {String} licenceNumber
 * @param {Object} format - row from NALD_RET_FORMATS table
 * @param {String} startDate - YYYY-MM-DD
 * @param {String} endDate - YYYY-MM-DD
 */
const getReturnId = (licenceNumber, format, startDate, endDate) => {
  return `v1:${format.FGAC_REGION_CODE}:${licenceNumber}:${format.ID}:${startDate}:${endDate}`;
};

/**
 * Split dates are the start date of the period.  This function
 * adds the period end dates to the array
 * @param {Array} arr - the array of split dates
 * @return {Array} an array containing the split dates and previous day
 */
const sortAndPairSplitDates = (arr) => {
  const sorted = arr.map(val => moment(val).format('YYYY-MM-DD')).sort();

  return sorted.reduce((acc, value) => {
    acc.push(moment(value).subtract(1, 'day').format('YYYY-MM-DD'));
    acc.push(value);
    return acc;
  }, []);
};

/**
 * Adds a date to the supplied array, if it is between but not equal to the
 * supplied start and end dates
 * @param {Array} dates
 * @param {String} date - YYYY-MM-DD, the date to add to array
 * @param {String} startDate - the start of the date range YYYY-MM-DD
 * @param {String} endDate - the end of the date range YYYY-MM-DD
 * @return {Array} new date array
 */
const addDate = (dates, date, startDate, endDate) => {
  const m = moment(date);
  const dateStr = m.format('YYYY-MM-DD');
  const arr = dates.slice();
  const isValid = m.isBetween(startDate, endDate, 'day', '()');
  const isUnique = !arr.includes(dateStr);
  if (isValid && isUnique) {
    arr.push(dateStr);
  }
  return arr;
};

/**
 * Gets the start date of the current period for the date supplied
 * @param {String} date - comparison date
 * @param {Boolean} isSummer - whether summer return
 * @return {String} YYYY-MM-DD next period start date
 */
const getPeriodStart = (date, isSummer) => {
  const m = moment(date);
  const month = isSummer ? 10 : 3;
  const comparison = moment().year(m.year()).month(month).date(1);
  const startYear = m.isBefore(comparison, 'day') ? m.year() - 1 : m.year();
  return moment().year(startYear).month(month).date(1).format('YYYY-MM-DD');
};

/**
 * Gets summer/financial year return cycles, including splitting the cycles
 * by licence effective start date (split date)
 * @param {String} startDate - YYYY-MM-DD
 * @param {String} endDate - YYYY-MM-DD
 * @param {String} splitDate - licence effective start date
 * @param {Boolean} isSummer - whether summer return cycle (default financial year)
 * @return {Array} of return cycle objects
 */
const getReturnCycles = (startDate, endDate, splitDate, isSummer = false) => {
  let splits = [];

  // Add split date
  splits = addDate(splits, splitDate, startDate, endDate);

  // Date pointer should be within summer/financial year
  let datePtr = moment().year();
  do {
    datePtr = getPeriodStart(datePtr, isSummer);
    splits = addDate(splits, datePtr, startDate, endDate);
    datePtr = moment(datePtr).add(1, 'year');
  }
  while (moment(datePtr).isBefore(endDate));

  const dates = chunk([startDate, ...sortAndPairSplitDates(splits), endDate], 2);

  return dates.map(arr => ({
    startDate: arr[0],
    endDate: arr[1],
    isCurrent: moment(arr[0]).isSameOrAfter(splitDate)
  }));
};

/**
 * Given format/return version data, gets the start and end dates of
 * this format
 * @param {Object} format
 * @return {String} date YYYY-MM-DD
 */
const getFormatStartDate = (format) => {
  const versionStartDate = moment(format.EFF_ST_DATE, 'DD/MM/YYYY');
  const timeLimitedStartDate = moment(format.TIMELTD_ST_DATE, 'DD/MM/YYYY');

  if (timeLimitedStartDate.isValid() && timeLimitedStartDate.isAfter(versionStartDate)) {
    return timeLimitedStartDate.format('YYYY-MM-DD');
  }
  return versionStartDate.format('YYYY-MM-DD');
};

/**
 * Given format/return version data, gets the start and end dates of
 * this format
 * @param {Object} format
 * @return {String} date YYYY-MM-DD or null
 */
const getFormatEndDate = (format) => {
  const versionEndDate = moment(format.EFF_END_DATE, 'DD/MM/YYYY');
  const timeLimitedEndDate = moment(format.TIMELTD_END_DATE, 'DD/MM/YYYY');

  const versionEndValid = versionEndDate.isValid();
  const timeLimitedValid = timeLimitedEndDate.isValid();
  const timeLimitedBefore = timeLimitedEndDate.isBefore(versionEndDate);

  // Valid end date and invalid time-limited date
  if (timeLimitedValid) {
    if (timeLimitedBefore || !versionEndValid) {
      return timeLimitedEndDate.format('YYYY-MM-DD');
    }
  }
  if (versionEndValid) {
    return versionEndDate.format('YYYY-MM-DD');
  }
  return null;
};

/**
 * Gets cycles for a given format.  If the format has no effective end date,
 * then one is created at the end of the following year.  These will be filtered
 * out later by checking if form logs exist for the cycles calculated
 * @param {Object} row of data from NALD_RET_FORMATS
 * @return {Array} array of return cycles with startDate and endDate in each item
 */
const getFormatCycles = (format, licenceEffectiveStartDate) => {
  const {
    FORM_PRODN_MONTH: productionMonth
  } = format;

  // Get summer cycle flag
  const { isSummer } = mapProductionMonth(productionMonth);

  // Get start/end date for format, taking into account version dates and
  // time-limited dates
  const startDate = getFormatStartDate(format);
  let endDate = getFormatEndDate(format);

  // If no end date, set date in future
  if (!endDate) {
    endDate = moment(getPeriodStart(moment().add(1, 'years'), isSummer)).subtract(1, 'day').format('YYYY-MM-DD');
  }

  return getReturnCycles(startDate, endDate, licenceEffectiveStartDate, isSummer);
};

/*
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
 * Gets quantity from NALD value
 * @param {String} value or 'null' as string
 * @return {Number|Boolean}
 */
const mapQuantity = (value) => {
  return value === '' ? null : parseFloat(value);
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
 * Gets return status
 * @param {String|null} receivedDate - the date received from NALD form logs YYYY-MM-DD, or null
 * @param {String} startDate - the start date of the return period
 * @return {String} status - completed|due
 */
const getStatus = (receivedDate) => {
  return receivedDate === null ? 'due' : 'completed';
};

const getDueDate = endDate => {
  const format = 'YYYY-MM-DD';
  return moment(endDate, format).add(28, 'days').format(format);
};

module.exports = {
  convertNullStrings,
  mapPeriod,
  mapProductionMonth,
  formatReturnMetadata,
  getFormatCycles,
  mapReceivedDate,
  getReturnId,
  getReturnCycles,
  parseReturnId,
  getStartDate,
  mapQuantity,
  mapUnit,
  mapUsability,
  getPeriodStart,
  addDate,
  getStatus,
  getFormatStartDate,
  getFormatEndDate,
  getDueDate
};
