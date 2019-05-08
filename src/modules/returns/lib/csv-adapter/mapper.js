const { unzip } = require('lodash');
const common = require('../common-mapping');
const util = require('util');
const parseCsv = util.promisify(require('csv-parse'));
const moment = require('moment');
const DATE_FORMAT = 'YYYY-MM-DD';
const GDS_DATE_FORMAT = 'D MMMM YYYY';
const GDS_MONTH_FORMAT = 'MMMM YYYY';
const { parseReturnId } = require('../../../../lib/returns');

/**
 * Trims and lowercases value
 * @param  {String} value
 * @return {String}
 */
const normalize = value => value.trim().toLowerCase();

/**
 * Parses a date label found in the CSV into a frequency
 * @param  {String} date - the date label from the CSV
 * @return {String}      - return frequency day|week|month
 */
const parseDateFrequency = date => {
  const d = normalize(date);
  if (d.startsWith('week ending ')) {
    return 'week';
  };
  if (d.match(/^[a-z]+ [0-9]{4}$/)) {
    return 'month';
  }
  if (d.match(/^[0-9]{1,2} [a-z]+ [0-9]{4}$/)) {
    return 'day';
  }
  throw new Error(`Could not parse return frequency from ${date}`);
};

/**
 * Creates a day line skeleton for the return
 * @param  {String} date - the date label in the CSV
 * @return {Object}      - a return line skeleton
 */
const createDay = date => ({
  startDate: moment(date, GDS_DATE_FORMAT).format(DATE_FORMAT),
  endDate: moment(date, GDS_DATE_FORMAT).format(DATE_FORMAT),
  timePeriod: 'day'
});

/**
 * Creates a week line skeleton for the return
 * @param  {String} date - the date label in the CSV
 * @return {Object}      - a return line skeleton
 */
const createWeek = date => ({
  startDate: moment(date, GDS_DATE_FORMAT).subtract(6, 'day').format(DATE_FORMAT),
  endDate: moment(date, GDS_DATE_FORMAT).format(DATE_FORMAT),
  timePeriod: 'week'
});

/**
 * Creates a month line skeleton for the return
 * @param  {String} date - the date label in the CSV
 * @return {Object}      - a return line skeleton
 */
const createMonth = date => ({
  startDate: moment(date, GDS_MONTH_FORMAT).startOf('month').format(DATE_FORMAT),
  endDate: moment(date, GDS_MONTH_FORMAT).endOf('month').format(DATE_FORMAT),
  timePeriod: 'month'
});

/**
 * Creates a skeleton return line object
 * @param  {String} dateLabel - the date label in the CSV
 * @return {Object}           - return line object
 */
const createReturnLine = dateLabel => {
  const frequency = parseDateFrequency(dateLabel);

  const actions = {
    day: createDay,
    week: createWeek,
    month: createMonth
  };

  const date = normalize(dateLabel).replace('week ending', '');

  return actions[frequency](date);
};

/**
 * Maps an abstracted volume to a float
 * - If empty string, returns null
 * - Otherwise parses as a number, which may include commas
 * @param  {String} value - the abstracted volume
 * @return {Number}
 */
const mapQuantity = value => {
  const val = normalize(value);
  if (val === '') {
    return null;
  }
  return parseFloat(val.replace(/,/g, ''));
};

/**
 * Creates return lines array by combining CSV header and column data
 * @param  {Array} headers      - header column from CSV data
 * @param  {Array} column       - return column from CSV data
 * @param  {String} readingType - the reading type - estimated|measured
 * @return {Array}              - return lines array
 */
const mapLines = (headers, column, readingType) => {
  const lineHeaders = headers.slice(6, -1);
  const lineCells = column.slice(6, -1);
  return lineHeaders.reduce((acc, dateLabel, index) => {
    const value = normalize(lineCells[index]);
    if (value === 'do not edit') {
      return acc;
    }
    return [...acc, {
      unit: 'm³',
      userUnit: 'm³',
      ...createReturnLine(dateLabel),
      quantity: mapQuantity(value),
      readingType
    }];
  }, []);
};

/**
 * Maps reading object
 * @param  {Array} column  - column of return data from CSV
 * @return {Object}        - return reading object
 */
const mapReading = column => ({
  type: normalize(column[3]) === 'y' ? 'measured' : 'estimated',
  method: 'abstractionVolumes',
  units: 'm³',
  totalFlag: false
});

/**
 * Maps CSV column data and reading type to a meters array for the return
 * object
 * @param  {Array} column  - column of return data from CSV
 * @param  {String} readingType - the reading type - estimated|measured
 * @return {Array}             array of meter objects (only 1 supported at present)
 */
const mapMeters = (column, readingType) => {
  if (readingType === 'estimated') {
    return [];
  }
  const manufacturer = column[4].trim();
  const serialNumber = column[5].trim();
  const meterDetailsProvided = manufacturer !== '' || serialNumber !== '';
  return [{
    meterDetailsProvided,
    manufacturer,
    serialNumber,
    multiplier: 1
  }];
};

/**
 * Maps column and context data into a return object compatible with the
 * water service schema
 * @param  {Array} column  - column of return data from CSV
 * @param  {Object} context - additional data to generate the return
 * @param {Object} context.user - current user data
 * @param {String} context.today - current date
 * @param {Array} context.headers - the header column from the CSV data
 * @return {Object}         a single return object
 */
const mapReturn = (column, context) => {
  const isNil = normalize(column[2]) === 'y';
  const returnId = column.slice(-1)[0];
  const { startDate, endDate, licenceNumber } = parseReturnId(returnId);

  // Create return skeleton
  const ret = {
    returnId,
    licenceNumber,
    receivedDate: context.today,
    startDate,
    endDate,
    isNil,
    ...common.getReturnSkeleton(),
    user: common.mapUser(context.user)
  };

  // Add lines/reading etc.
  if (!isNil) {
    ret.reading = mapReading(column);
    ret.lines = mapLines(context.headers, column, ret.reading.type);
    ret.meters = mapMeters(column, ret.reading.type);
  }

  // Return
  return ret;
};

/**
 * Maps a CSV file in string form to an array of return objects
 * @param  {String}  csvStr - CSV file in string form
 * @param  {Object}  user   - current user
 * @param  {String}  [today]- current date YYYY-MM-DD
 * @return {Promise<Array>} resolves with array of return objects
 */
const mapCsv = async (csvStr, user, today) => {
  const data = await parseCsv(csvStr);

  const [headers, ...returns] = unzip(data);

  const context = {
    user,
    today: today || moment().format(DATE_FORMAT),
    headers
  };

  return returns.map(ret => mapReturn(ret, context));
};

exports._normalize = normalize;
exports._parseDateFrequency = parseDateFrequency;
exports._createDay = createDay;
exports._createWeek = createWeek;
exports._createMonth = createMonth;
exports._createReturnLine = createReturnLine;
exports._mapLines = mapLines;
exports._mapReading = mapReading;
exports._mapMeters = mapMeters;
exports._mapReturn = mapReturn;
exports._mapQuantity = mapQuantity;

exports.mapCsv = mapCsv;
