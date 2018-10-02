const { get, pick } = require('lodash');
const moment = require('moment');
const { convertToCubicMetres, convertToUserUnit } = require('./unit-conversion');
const uuidv4 = require('uuid/v4');

/**
 * Converts a line from the returns service to
 * the format for the water service return model
 * @param {Object} line - from return service
 * @return {Object}
 */
const returnLineToModel = (line) => {
  const {
    start_date: startDate,
    end_date: endDate,
    quantity,
    user_unit: userUnit,
    time_period: timePeriod,
    reading_type: readingType
  } = line;

  return {
    startDate,
    endDate,
    quantity: convertToUserUnit(quantity, userUnit),
    timePeriod,
    readingType
  };
};

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

  return lines;
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

const getMetersFromVersionMetadata = version => {
  const meters = get(version, 'metadata.meters', []);
  return meters;
};

const getReadingFromVersionMetadata = version => {
  const nullVersionMetadata = {
    // Can be measured | estimated
    type: null,
    // For estimated, shows method used for estimation
    method: null,
    // Can be m3, l, Ml, gal
    units: null,
    // Only used when single total value has been given rather than individual amounts
    totalFlag: null,
    total: null
  };

  return version
    ? pick(version.metadata, Object.keys(nullVersionMetadata))
    : nullVersionMetadata;
};

/**
 * Creates a unified data model for a single return
 * @param {Object} ret - return
 * @param {Object} version - the current / selected version of the return
 * @param {Array} lines - array of line data
 * @param {Object} document - CRM document
 * @return {Object} unified view of return
 */
const mapReturnToModel = (ret, version, lines, versions) => {
  const requiredLines = lines.length ? null : getRequiredLines(ret.start_date, ret.end_date, ret.returns_frequency);

  return {
    returnId: ret.return_id,
    licenceNumber: ret.licence_ref,
    receivedDate: ret.received_date,
    startDate: moment(ret.start_date).format('YYYY-MM-DD'),
    endDate: moment(ret.end_date).format('YYYY-MM-DD'),
    frequency: ret.returns_frequency,
    isNil: get(version, 'nil_return'),
    status: ret.status,
    versionNumber: version ? version.version_number : null,
    isCurrent: version ? version.current : null,
    reading: getReadingFromVersionMetadata(version),
    meters: getMetersFromVersionMetadata(version),
    requiredLines,
    lines: lines ? lines.map(returnLineToModel) : null,
    metadata: ret.metadata,
    versions: versions.map(version => {
      return {
        versionNumber: version.version_number,
        email: version.user_id,
        createdAt: version.created_at,
        isCurrent: version.current
      };
    })
  };
};

/**
 * Maps return model back to a return version row
 * @param {Object} ret - return model
 * @return {Object} version row for returns service
 */
const mapReturnToVersion = (ret) => {
  return {
    version_id: uuidv4(),
    return_id: ret.returnId,
    user_id: ret.user.email,
    user_type: ret.user.type,
    version_number: ret.versionNumber,
    metadata: JSON.stringify({
      ...ret.reading,
      meters: ret.meters
    }),
    nil_return: ret.isNil,
    current: true
  };
};

/**
 * Maps return model back to return lines
 * @param {Object} ret - return model
 * @return {Array} lines rows for returns service
 */
const mapReturnToLines = (ret, version) => {
  if (ret.lines) {
    return ret.lines.map(line => ({
      line_id: uuidv4(),
      version_id: version.version_id,
      substance: 'water',
      quantity: convertToCubicMetres(line.quantity, ret.reading.units),
      unit: 'm³',
      user_unit: ret.reading.units,
      start_date: line.startDate,
      end_date: line.endDate,
      time_period: line.timePeriod,
      metadata: '{}',
      reading_type: ret.reading.type
    }));
  }
  return null;
};

/**
 * Maps water service model to those fields that need updating in returns service
 * @param {Object} ret - water service return model
 * @return {Object} data to store in returns table of returns service
 */
const mapReturn = (ret) => {
  const { status, receivedDate } = ret;

  return {
    status,
    received_date: receivedDate
  };
};

module.exports = {
  mapReturnToModel,
  mapReturnToVersion,
  mapReturnToLines,
  mapReturn,
  getRequiredLines
};
