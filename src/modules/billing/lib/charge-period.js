'use strict';

const moment = require('moment');
const { sortBy, first, last, identity } = require('lodash');

const DateRange = require('../../../lib/models/date-range');

/**
 * Given an array of dates which can be parsed by Moment,
 * filters out falsey values and returns a list of moment objects
 * sorted in ascending date order
 * @param {Array<String>} arr
 * @return {Array<Object>}
 */
const getSortedDates = arr => sortBy(
  arr
    .filter(identity)
    .map(value => moment(value)),
  m => m.unix()
);

const getMinDate = arr => first(getSortedDates(arr));
const getMaxDate = arr => last(getSortedDates(arr));

/**
 * Gets dates for charge period start and end date functions
 * @param {FinancialYear} financialYear
 * @param {ChargeVersion} chargeVersion
 * @param {Boolean} isStartDate
 */
const getDates = (financialYear, chargeVersion, isStartDate = true) => {
  const dateType = isStartDate ? 'start' : 'end';
  const dateRef = `${dateType}Date`;
  return [
    chargeVersion.licence[dateRef],
    financialYear[dateType],
    chargeVersion.dateRange[dateRef]
  ];
};

const getChargePeriodStartDate = (financialYear, chargeVersion) => getMaxDate(
  getDates(financialYear, chargeVersion)).format('YYYY-MM-DD');

const getChargePeriodEndDate = (financialYear, chargeVersion) => getMinDate(
  getDates(financialYear, chargeVersion, false)).format('YYYY-MM-DD');

const getChargePeriod = (financialYear, chargeVersion) => {
  const startDate = getChargePeriodStartDate(financialYear, chargeVersion);
  const endDate = getChargePeriodEndDate(financialYear, chargeVersion);
  return new DateRange(startDate, endDate);
};

exports.getChargePeriodEndDate = getChargePeriodEndDate;
exports.getChargePeriodStartDate = getChargePeriodStartDate;
exports.getChargePeriod = getChargePeriod;
