const moment = require('moment');
const dateFormat = 'YYYY-MM-DD';

const createReturn = options => {
  return {
    'returnId': options.returnId || 'return-id',
    'startDate': options.startDate,
    'endDate': options.endDate,
    'frequency': options.frequency,
    'status': options.status,
    'isNil': options.isNil,
    'isCurrent': true,
    'lines': (options.lineData) ? getReturnLines(options.frequency, options.lineData) : [],
    'metadata': {
      'nald': {
        'areaCode': 'ARCA',
        'formatId': 10042708,
        'regionCode': 1,
        'periodEndDay': options.periodEndDay,
        'periodEndMonth': options.periodEndMonth,
        'periodStartDay': options.periodStartDay,
        'periodStartMonth': options.periodStartMonth
      },
      'isFinal': false,
      'version': 1,
      'isSummer': true,
      'isUpload': false,
      'purposes': options.purposes || createPurposeData(options.tertiaryCode),
      'isCurrent': true,
      'isTwoPartTariff': true
    },
    'isUnderQuery': false
  };
};

const createPurposeData = tertiaryCode => {
  return [{
    'alias': 'Spray Irrigation - Direct',
    'primary': {
      'code': 'A',
      'description': 'Agriculture'
    },
    'tertiary': {
      'code': tertiaryCode,
      'description': 'Spray Irrigation - Direct'
    },
    'secondary': {
      'code': 'AGR',
      'description': 'General Agriculture'
    }
  }];
};

const getReturnLines = (frequency, lineData) => {
  return lineData.map(line => {
    return {
      startDate: moment(line.startDate).format(dateFormat),
      endDate: moment(line.startDate).endOf(frequency).format(dateFormat),
      quantity: line.quantity,
      quantityAllocated: line.quantityAllocated,
      timePeriod: frequency
    };
  });
};

const createLineData = (startDate, frequency, quantities) => {
  const totalLines = quantities.length;
  const lineData = [];
  for (var i = 0; i < totalLines; i++) {
    lineData.push({
      startDate: moment(startDate).add(i, `${frequency}s`).format(dateFormat),
      quantity: quantities[i] !== null ? quantities[i] : null
    });
  }
  return lineData;
};

/**
 * Requires: start & end dates, abstraction start & end day and month, tertiary code
 * @param {Object} options
 */
const createMonthlyReturn = options => {
  const { startDate, quantities } = options;
  const lineData = createLineData(startDate, 'month', quantities);
  return createReturn({
    ...options,
    lineData,
    frequency: 'month'
  });
};

/**
 * startDate must be a Sunday
 * @param {Object} options
 */
const createWeeklyReturn = options => {
  const { startDate, quantities } = options;
  const lineData = createLineData(startDate, 'week', quantities);
  return createReturn({
    ...options,
    lineData,
    frequency: 'week'
  });
};

exports.createReturn = createReturn;
exports.createMonthlyReturn = createMonthlyReturn;
exports.createWeeklyReturn = createWeeklyReturn;
exports.createPurposeData = createPurposeData;
exports.createLineData = createLineData;
