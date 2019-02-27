const moment = require('moment');

/**
 * General UK date formatter
 * @param {String} str - NALD date string, can be 'null', format dd/mm/yyyy
 * @param {String} outputFormat - output date format
 * @param {String} inputFormat - optional input format
 * @return {String} - date in new format
 */
const dateFormatter = (str, inputFormat, outputFormat) => {
  const d = moment(str, inputFormat);
  return d.isValid() ? d.format(outputFormat) : null;
};

/**
 * Formats a UK date from NALD data to sortable date
 * e.g. 31/01/2018 becomes 20180131
 * @param {String} str - NALD date string, can be 'null'
 * @return {String} date in sortable date format
 */
const dateToSortableString = (str) => {
  return dateFormatter(str, 'DD/MM/YYYY', 'YYYYMMDD');
};

/**
 * Formats a UK date from NALD data to a SQL style ISO date
 * e.g. 31/01/2018 becomes 2018-01-31
 * @param {String} str - NALD date string, can be 'null'
 * @return {String} date in SQL format
 */
const dateToIsoString = (str) => {
  return dateFormatter(str, 'DD/MM/YYYY', 'YYYY-MM-DD');
};

/**
 * Formats returns date in form YYYYMMDDHHmmSS to ISO YYYY-MM-DD
 * @param {String} date from NALD returns line
 * @return {String} ISO date YYYY-MM-DD
 */
const returnsDateToIso = (str) => {
  return dateFormatter(str, 'YYYYMMDD', 'YYYY-MM-DD');
};

exports.dateToIsoString = dateToIsoString;
exports.dateToSortableString = dateToSortableString;
exports.returnsDateToIso = returnsDateToIso;
