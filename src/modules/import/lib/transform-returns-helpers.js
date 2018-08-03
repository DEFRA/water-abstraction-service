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
    nald: {
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
    }
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
 * Gets returns cycles given a list of return formats
 * @param {Array} formats
 * @return {array}
 */
const getCycles = (formats) => {
  const dates = [];

  for (let format of formats) {
    const info = mapProductionMonth(format.FORM_PRODN_MONTH);
    const effStart = moment(format.EFF_ST_DATE, 'DD/MM/YYYY');
    const effEnd = format.EFF_END_DATE === 'null' ? null : moment(format.EFF_END_DATE, 'DD/MM/YYYY');

    const yearEnd = moment().month(2).date(31);

    const endDate = effEnd || moment();

    let datePtr = effStart;

    while (datePtr.isBefore(endDate)) {
      dates.push({format, info, date: effStart.format('YYYY-MM-DD')});

      if (info.isSummer && datePtr.month() === 3) {
        datePtr.month(8).date(30);
        dates.push({format, info, date: datePtr.format('YYYY-MM-DD')});
        datePtr.month(9).date(1);
      } else {
        datePtr.month(2).date(31).year(datePtr.year() + 1);
        dates.push({format, info, date: datePtr.format('YYYY-MM-DD')});
        datePtr.month(3).date(1);
      }
    }
  }

  const cycles = chunk(dates, 2).map(pair => ({
    format: pair[0].format,
    info: pair[0].info,
    startDate: pair[0].date,
    endDate: pair[1].date
  }));

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

/**
 * Creates / retrieves return in list
 * @param {Array} rows of returns
 * @return {Object} created/retrieved return row
 */
// const createReturn = (licenceNumber, returns, format, log) => {
//
//
//   const returnId = `v1:${format.FGAC_REGION_CODE}:${licenceNumber}:${format.ID}:${startDate}`;
//
//   // Create new return row
//   returnRow = {
//     return_id: returnId,
//     regime: 'water',
//     licence_type: 'abstraction',
//     licence_ref: licenceNumber,
//     start_date: startDate,
//     end_date: endDate,
//     returns_frequency: mapFrequency(format.ARTC_REC_FREQ_CODE),
//     status: 'complete',
//     source: 'NALD',
//     metadata: JSON.stringify(formatReturnMetadata(format)),
//     received_date: log.RECD_DATE === '' ? null : dateToIsoString(log.RECD_DATE)
//   };
//
//   console.log('Create return!', startDate, endDate);
//
//   returns.push(returnRow);
//   return returnRow;
// };

module.exports = {
  convertNullStrings,
  mapFrequency,
  mapPeriod,
  getStartDate,
  mapUnit,
  mapUsability,
  // findReturn,
  getPeriod,
  formatReturnMetadata,
  getCycles
};
