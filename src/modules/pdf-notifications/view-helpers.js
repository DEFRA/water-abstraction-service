const moment = require('moment');
const { chunk } = require('lodash');
/**
 * Outputs the region name given the NALD region code
 * @param {Number} code
 * @return {String}
 */
const naldRegion = (code) => {
  const codes = {
    1: 'Anglian',
    2: 'Midlands',
    3: 'North east',
    4: 'North west',
    5: 'South west',
    6: 'Southern',
    7: 'Thames'
  };

  return codes[parseInt(code)];
};

/**
 * Formats date using specified moment format string
 * @param {String} dateStr - the date string
 * @param {String} format - the moment date format
 * @return {String} formatted date
 */
const dateFormat = (dateStr, format = 'D MMMM YYYY') => {
  return moment(dateStr).format(format);
};

const paginateReturnLines = (startDate, endDate, returnsFrequency) => {
  // Create array of dates
  let datePtr = moment(startDate);
  const dates = [];
  do {
    dates.push(datePtr.format('D MMMM YYYY'));
    datePtr.add(1, 'days');
  } while (datePtr.isSameOrBefore(endDate));

  // 19 lines per page
  const columns = chunk(dates, 19);

  // 3 columns per page
  return chunk(columns, 3);
};

const stringify = (obj) => {
  return JSON.stringify(obj, null, 2);
};

module.exports = {
  naldRegion,
  dateFormat,
  paginateReturnLines,
  stringify
};
