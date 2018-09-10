const moment = require('moment');
const { findIndex, max, mapValues } = require('lodash');
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
 * Splits a cycle in to two cycles if the supplied comparison date is within the
 * cycle
 * @param {Object}
 * @param {String} splitDate - YYYY-MM-DD
 * @return {Array} with one or two cycles
 */
const splitCycle = (cycle, splitDate) => {
  const { startDate, endDate } = cycle;
  // console.log('Split date', splitDate, cycle);
  if (moment(splitDate).isBetween(startDate, endDate)) {
    const cycleOneEnd = moment(splitDate).subtract(1, 'day').format('YYYY-MM-DD');
    const cycleTwoStart = moment(splitDate).format('YYYY-MM-DD');
    return [
      { startDate, endDate: cycleOneEnd },
      { startDate: cycleTwoStart, endDate }
    ];
  }
  return [cycle];
};

/**
 * Gets the returns cycle for the given format, using getFormatCycles
 * A flag is added to the cycle to indicate whether it relates to the current
 * licence version
 * Where a cycle includes the version start date of a licence, that cycle is
 * split into two, with one current and one non-current cycle
 * @param {Object} format
 * @param {String} versionStartDate - YYYY-MM-DD the effective start date of the current licence version
 * @return {Array} returns cycles
 */
const getCurrentCycles = (cycles, versionStartDate) => {
  return cycles.reduce((acc, cycle) => {
    const split = splitCycle(cycle, versionStartDate);
    for (let cycle of split) {
      acc.push({
        ...cycle,
        isCurrent: moment(versionStartDate).isSameOrBefore(cycle.startDate)
      });
    }
    return acc;
  }, []);
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
<<<<<<< HEAD
 * Gets either financial or summer return cycles within the specified date range
 * @param {String} startDate - the start date of the first cycle YYYY-MM-DD
 * @param {String} endDate - the end date of the last cycle
 * @param {Boolean} isSummer - true if summer cycle
 * @return {Array} list of return cycles
 */
const getReturnCycles = (startDate, endDate, isSummer = false) => {
  let datePtr = moment(startDate);
  const dateFunc = isSummer ? getSummerYear : getFinancialYear;
  const cycles = [];
  while (datePtr.isSameOrBefore(endDate)) {
    cycles.push(dateFunc(datePtr));
    datePtr.add(1, 'year');
  };
  cycles[0].startDate = startDate;
  cycles[cycles.length - 1].endDate = endDate;
  return cycles;
};

/**
 * Gets the start of the period (month/week) for a given date
 * @param {String} date - YYYY-MM-DD
 * @param {String} period - month|week
 * @return {String} date - YYYY-MM-DD
 */
const startOfPeriod = (date, period) => {
  if (['month', 'week'].includes(period)) {
    return moment(date).startOf(period).format('YYYY-MM-DD');
  }
  return moment(date).format('YYYY-MM-DD');
};

/**
 * Rounds date down as follows:
 * - for period of 'month', date is rounded down to the end of the previous month
 * - for period of 'week', date is rounded down to end of previous week
 * - for other periods, date is unchanged
 * @param {String} date - YYYY-MM-DD
 * @param {String} period - month|week|year etc
 * @return {String} date - YYYY-MM-DD rounded down to end of previous period
 */
const endOfPreviousPeriod = (date, period) => {
  if (['month', 'week'].includes(period)) {
    const m = moment(date);
    const m2 = moment(m).endOf(period);
    return m.isSame(m2, 'day') ? date : m.subtract(1, period).endOf(period).format('YYYY-MM-DD');
  }
  return moment(date).format('YYYY-MM-DD');
};

/**
 * Gets cycles for a given format.  If the format has no effective end date,
 * then one is created at the end of the following year.  These will be filtered
 * out later by checking if form logs exist for the cycles calculated
 * @param {Object} row of data from NALD_RET_FORMATS
 * @return {Array} array of return cycles with startDate and endDate in each item
 */
const getFormatCycles = (format) => {
  const {
    ARTC_REC_FREQ_CODE: frequencyCode,
    FORM_PRODN_MONTH: productionMonth,
    EFF_END_DATE: effectiveEndDate,
    EFF_ST_DATE: effectiveStartDate
  } = format;

  const { isSummer } = mapProductionMonth(productionMonth);
  const dateFunc = isSummer ? getSummerYear : getFinancialYear;

  // Calculate start/end date.  If these are mid-way through month/week
  // for monthly/weekly returns, we truncate these
  const period = mapPeriod(frequencyCode);

  const effStart = moment(effectiveStartDate, 'DD/MM/YYYY');
  const startDate = startOfPeriod(effStart, period);
  const endDate = effectiveEndDate === 'null' ? dateFunc(moment().add(1, 'years')).endDate : endOfPreviousPeriod(moment(effectiveEndDate, 'DD/MM/YYYY'));
  return getReturnCycles(startDate, endDate, isSummer);
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

module.exports = {
  convertNullStrings,
  mapPeriod,
  mapProductionMonth,
  formatReturnMetadata,
  getFinancialYear,
  getSummerYear,
  getFormatCycles,
  getCurrentCycles,
  mapReceivedDate,
  getReturnId,
  getReturnCycles,
  startOfPeriod,
  endOfPreviousPeriod,
  parseReturnId,
  getStartDate,
  mapQuantity,
  mapUnit,
  mapUsability
};
