const { get } = require('lodash');
const moment = require('moment');

/**
 * Get required daily return lines
 * @param {String} startDate - YYYY-MM-DD start date of return cycle
 * @param {String} endDate - YYYY-MM-DD end date of return cycle
 * @return {Array} list of required return lines
 */
const getDays = (startDate, endDate) => {
  const datePtr = moment(startDate);
  const lines = [];
  do {
    lines.push({
      startDate: datePtr.format('YYYY-MM-DD'),
      endDate: datePtr.format('YYYY-MM-DD'),
      timePeriod: 'day'
    });
    datePtr.add(1, 'day');
  }
  while (datePtr.isSameOrBefore(endDate, 'day'));

  return lines;
};

/**
 * Get required monthly return lines
 * @param {String} startDate - YYYY-MM-DD start date of return cycle
 * @param {String} endDate - YYYY-MM-DD end date of return cycle
 * @return {Array} list of required return lines
 */
const getMonths = (startDate, endDate) => {
  const datePtr = moment(startDate);
  const lines = [];
  do {
    lines.push({
      startDate: datePtr.startOf('month').format('YYYY-MM-DD'),
      endDate: datePtr.endOf('month').format('YYYY-MM-DD'),
      timePeriod: 'month'
    });
    datePtr.add(1, 'month');
  }
  while (datePtr.isSameOrBefore(endDate, 'month'));
  return lines;
};

/**
 * Get required annual return lines
 * @param {String} startDate - YYYY-MM-DD start date of return cycle
 * @param {String} endDate - YYYY-MM-DD end date of return cycle
 * @return {Array} list of required return lines
 */
const getYears = (startDate, endDate) => {
  return [{
    startDate,
    endDate,
    timePeriod: 'year'
  }];
};

/**
 * Get required weekly return lines
 * @param {String} startDate - YYYY-MM-DD start date of return cycle
 * @param {String} endDate - YYYY-MM-DD end date of return cycle
 * @return {Array} list of required return lines
 */
const getWeeks = (startDate, endDate) => {
  const datePtr = moment(startDate);
  const lines = [];
  datePtr.startOf('week');
  do {
    lines.push({
      startDate: datePtr.startOf('week').format('YYYY-MM-DD'),
      endDate: datePtr.endOf('week').format('YYYY-MM-DD'),
      timePeriod: 'week'
    });
    datePtr.add(1, 'week');
  }
  while (datePtr.isSameOrBefore(endDate, 'month'));
};

/**
 * Calculates lines required in return
 * @param {String} startDate - YYYY-MM-DD
 * @param {String} endDate - YYYY-MM-DD
 * @param {String} frequency
 * @return {Array} array of required lines
 */
const getRequiredLines = (startDate, endDate, frequency) => {
  switch (frequency) {
    case 'day':
      return getDays(startDate, endDate);

    case 'week':
      return getWeeks(startDate, endDate);

    case 'month':
      return getMonths(startDate, endDate);

    case 'year':
      return getYears(startDate, endDate);

    default:
      throw new Error(`Unknown frequency ${frequency}`);
  }
};

/**
 * Creates a unified data model for a single return
 * @param {Object} ret - return
 * @param {Object} version - the current / selected version of the return
 * @param {Array} lines - array of line data
 * @return {Object} unified view of return
 */
const createModel = (ret, version, lines) => {
  const requiredLines = lines.length ? null : getRequiredLines(ret.start_date, ret.end_date, ret.returns_frequency);

  return {
    returnId: ret.return_id,
    licenceNumber: ret.licence_ref,
    startDate: moment(ret.start_date).format('YYYY-MM-DD'),
    endDate: moment(ret.end_date).format('YYYY-MM-DD'),
    frequency: ret.returns_frequency,
    isNil: get(version, 'nil_return'),
    status: ret.status,
    versionNumber: version ? version.version_number : null,
    reading: {
      // Can be measured | estimated
      type: null,
      // For estimate, shows method used for estimation
      method: null,
      pumpCapacity: null,
      hoursRun: null,
      numberLivestock: null,
      // Can be m3, l, Ml, gal
      units: null,
      // Only used when single total value has been given rather than individual amounts
      totalFlag: null,
      total: null
    },
    requiredLines,
    lines,
    metadata: ret.metadata
  };
};

/**
 * Maps return model back to a return version row
 * @param {Object} ret - return model
 * @return {Object} version row for returns service
 */
const mapReturnToVersion = (ret) => {
  const versionId = `${ret.returnId}_${ret.versionNumber}`;

  return {
    version_id: versionId,
    return_id: ret.returnId,
    user_id: ret.user.email,
    user_type: ret.user.type,
    version_number: ret.versionNumber,
    metadata: ret.reading,
    nil_return: ret.nilReturn
  };
};

/**
 * Maps return model back to return lines
 * @param {Object} ret - return model
 * @return {Array} lines rows for returns service
 */
const mapReturnToLines = (ret) => {
  const versionId = `${ret.returnId}_${ret.versionNumber}`;

  if (ret.lines) {
    return ret.lines.map(line => ({
      line_id: `${versionId}_${line.startDate}_${line.endDate}`,
      version_id: versionId,
      substance: 'water',
      quantity: line.quantity,
      unit: ret.reading.units,
      start_date: line.startDate,
      end_date: line.endDate,
      time_period: line.timePeriod,
      metadata: '{}',
      reading_type: ret.reading.type
    }));
  }
  return null;
};

module.exports = {
  createModel,
  mapReturnToVersion,
  mapReturnToLines
};
