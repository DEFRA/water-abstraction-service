const { get } = require('lodash');
const moment = require('moment');

/**
 * Calculates lines required in return
 * @param {String} startDate - YYYY-MM-DD
 * @param {String} endDate - YYYY-MM-DD
 * @param {String} frequency
 * @return {Array} array of required lines
 */
const getRequiredLines = (startDate, endDate, frequency) => {
  const lines = [];
  const datePtr = moment(startDate);
  if (frequency === 'day') {
    do {
      lines.push({
        startDate: datePtr.format('YYYY-MM-DD'),
        endDate: datePtr.format('YYYY-MM-DD'),
        timePeriod: 'day'
      });
      datePtr.add(1, 'day');
    }
    while (datePtr.isSameOrBefore(endDate, 'day'));
  } else if (frequency === 'month') {
    do {
      lines.push({
        startDate: datePtr.startOf('month').format('YYYY-MM-DD'),
        endDate: datePtr.endOf('month').format('YYYY-MM-DD'),
        timePeriod: 'month'
      });
      datePtr.add(1, 'month');
    }
    while (datePtr.isSameOrBefore(endDate, 'month'));
  } else if (frequency === 'year') {
    lines.push({
      startDate,
      endDate,
      timePeriod: 'year'
    });
  } else {
    throw new Error(`Unknown return frequency ${frequency}`);
  }
  return lines;
};

/**
 * Creates a unified data model for a single return
 * @param {Object} ret - return
 * @param {Object} version - the current / selected version of the return
 * @param {Array} lines - array of line data
 * @return {Object} unified view of return
 */
const createModel = (ret, version, lines) => {
  return {
    returnId: ret.return_id,
    frequency: ret.returns_frequency,
    isNil: get(version, 'nil_return'),
    reading: {
      type: null,
      method: null,
      pumpCapacity: null,
      hoursRun: null,
      numberLivestock: null,
      units: null
    },
    requiredLines: getRequiredLines(ret.start_date, ret.end_date, ret.returns_frequency),
    lines
  };
};

module.exports = {
  createModel
};
