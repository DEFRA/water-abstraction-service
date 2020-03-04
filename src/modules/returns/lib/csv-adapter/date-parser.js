const moment = require('moment');
const { flatMap } = require('lodash');
const DATE_FORMAT = 'YYYY-MM-DD';

// preferred format for dates is D MMMM YYYY, but some applications
// may output the CSV in another format. This list attempts to deal
// with the unexpected formats without risking potential
// crossovers between formats such at DD/MM/YYYY and MM/DD/YYYY
// by using a sample of potential separators.
const GDS_DATE_FORMATS = flatMap([
  ['D', 'MMMM', 'YYYY'],
  ['D', 'MMM', 'YYYY'],
  ['D', 'MM', 'YYYY'],
  ['D', 'MMMM', 'YY'],
  ['D', 'MMM', 'YY'],
  ['D', 'MM', 'YY']
], date => ([
  date.join(' '),
  date.join('/'),
  date.join('-')
]));

const GDS_MONTH_FORMATS = flatMap([
  ['MMMM', 'YYYY'],
  ['MMM', 'YYYY'],
  ['MMMM', 'YY'],
  ['MMM', 'YY']
], date => ([
  date.join(' '),
  date.join('-')
]));
const removeWeekEnding = string => string.replace(/week ending /i, '');

const validateDailyDate = dateString => moment(dateString, GDS_DATE_FORMATS, true).isValid();

const validateMonthlyDate = dateString => moment(dateString, GDS_MONTH_FORMATS, true).isValid();

/**
 * Finds the return frequency based on the format of the date string
 * @param {String} date trimmed and in lowercase
 * @return {String} return frequency
 */
const getDateFrequency = date => {
  if (date.startsWith('week ending')) return 'week';
  if (validateDailyDate(date)) return 'day';
  if (validateMonthlyDate(date)) return 'month';
};

/**
 * Creates a day line skeleton for the return
 * @param  {String} date - the date label in the CSV
 * @return {Object}      - a return line skeleton
 */
const createDay = date => {
  return {
    startDate: moment(date, GDS_DATE_FORMATS, true).format(DATE_FORMAT),
    endDate: moment(date, GDS_DATE_FORMATS, true).format(DATE_FORMAT),
    timePeriod: 'day'
  };
};

/**
 * Creates a week line skeleton for the return
 * @param  {String} date - the date label in the CSV
 * @return {Object}      - a return line skeleton
 */
const createWeek = dateString => {
  const date = removeWeekEnding(dateString);
  if (!validateDailyDate(date)) return null;
  return {
    startDate: moment(date, GDS_DATE_FORMATS, true).subtract(6, 'day').format(DATE_FORMAT),
    endDate: moment(date, GDS_DATE_FORMATS, true).format(DATE_FORMAT),
    timePeriod: 'week'
  };
};

/**
 * Creates a month line skeleton for the return
 * @param  {String} date - the date label in the CSV
 * @return {Object}      - a return line skeleton
 */
const createMonth = date => {
  return {
    startDate: moment(date, GDS_MONTH_FORMATS, true).startOf('month').format(DATE_FORMAT),
    endDate: moment(date, GDS_MONTH_FORMATS, true).endOf('month').format(DATE_FORMAT),
    timePeriod: 'month'
  };
};

const dateMethods = {
  day: createDay,
  week: createWeek,
  month: createMonth
};

/**
 * Constructs a return line or returns null if one isn't able to be made
 * @param {String} dateString date label as it appears in the csv
 * @return {Object|null} return line { startDate, endDate, timePeriod }
 */
const parse = (dateString) => {
  const normalisedDateString = dateString.trim().toLowerCase();
  const frequency = getDateFrequency(normalisedDateString);
  return (frequency) ? dateMethods[frequency](normalisedDateString) : null;
};

/**
 * Checks whether or not the date string contains a valid date
 * @param {String} dateString date label as it appears in the csv
 * @return {Boolean} whether or not the date is valid
 */
const validate = dateString => parse(dateString) !== null;

exports.GDS_DATE_FORMATS = GDS_DATE_FORMATS;
exports.GDS_MONTH_FORMATS = GDS_MONTH_FORMATS;

exports.validate = validate;
exports.parse = parse;

exports._getDateFrequency = getDateFrequency;
exports._createDay = createDay;
exports._createWeek = createWeek;
exports._createMonth = createMonth;
