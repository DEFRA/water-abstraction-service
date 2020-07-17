'use strict';

const dateHelpers = require('./date-helpers');
const DateRange = require('../../../lib/models/date-range');

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

const getChargePeriodStartDate = (financialYear, chargeVersion) => dateHelpers.getMaxDate(
  getDates(financialYear, chargeVersion)).format('YYYY-MM-DD');

const getChargePeriodEndDate = (financialYear, chargeVersion) => dateHelpers.getMinDate(
  getDates(financialYear, chargeVersion, false)).format('YYYY-MM-DD');

const getChargePeriod = (financialYear, chargeVersion) => {
  const startDate = getChargePeriodStartDate(financialYear, chargeVersion);
  const endDate = getChargePeriodEndDate(financialYear, chargeVersion);
  return new DateRange(startDate, endDate);
};

exports.getChargePeriodEndDate = getChargePeriodEndDate;
exports.getChargePeriodStartDate = getChargePeriodStartDate;
exports.getChargePeriod = getChargePeriod;
