'use strict';

const moment = require('moment');

const DATE_FORMAT = 'YYYY-MM-DD';

/**
 * Takes an input and turns it into a string representation of a date
 * in the format YYYY-MM-DD
 *
 * @param {*} input A date, moment, string or null to format
 */
const formatDate = input => {
  return input ? moment(input).format(DATE_FORMAT) : null;
};

exports.formatDate = formatDate;
