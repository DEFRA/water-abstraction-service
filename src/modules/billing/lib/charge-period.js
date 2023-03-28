'use strict'

const moment = require('moment')

const config = require('../../../../config')

const DATE_FORMAT = 'YYYY-MM-DD'
const DateRange = require('../../../lib/models/date-range')

/**
 * Given an array of dates which can be parsed by Moment,
 * filters out falsey values and returns a list of moment objects
 * sorted in ascending date order
 * @param {Array<String>} arr
 * @return {Array<Object>}
 */
const getSortedDates = arr => {
  // Filter will filter out any falsey values
  const newArray = arr
    .filter(a => a)
    .map(value => moment(value))

  return newArray.sort((a, b) => moment(a).unix() - moment(b).unix())
}

const getMinDate = arr => getSortedDates(arr)[0]
const getMaxDate = (arr) => {
  const sorted = getSortedDates(arr)
  return sorted[sorted.length - 1]
}

/**
 * Gets dates for charge period start and end date functions
 * @param {FinancialYear} financialYear
 * @param {ChargeVersion} chargeVersion
 * @param {Boolean} isStartDate
 */
const getDates = (financialYear, chargeVersion, isStartDate = true) => {
  const dateType = isStartDate ? 'start' : 'end'
  const dateRef = `${dateType}Date`
  return [
    chargeVersion.licence[dateRef],
    financialYear[dateType],
    chargeVersion.dateRange[dateRef]
  ]
}

const getChargePeriodStartDate = (financialYear, chargeVersion) => getMaxDate(
  getDates(financialYear, chargeVersion)).format(DATE_FORMAT)

const getChargePeriodEndDate = (financialYear, chargeVersion) => getMinDate(
  getDates(financialYear, chargeVersion, false)).format(DATE_FORMAT)

const getChargePeriod = (financialYear, chargeVersion) => {
  const startDate = getChargePeriodStartDate(financialYear, chargeVersion)
  const endDate = getChargePeriodEndDate(financialYear, chargeVersion)
  return new DateRange(startDate, endDate)
}

/**
 * Predicate to check whether the supplied date is
 * for a NALD transaction
 *
 * This is configured via the naldSwitchOverDate config option
 *
 * @param {String} chargePeriodStartDate
 * @return {Boolean}
 */
const isNaldTransaction = chargePeriodStartDate => {
  const startDate = moment(chargePeriodStartDate, DATE_FORMAT)
  const comparisonDate = moment(config.billing.naldSwitchOverDate, DATE_FORMAT)
  return startDate.isBefore(comparisonDate)
}

exports.getChargePeriodEndDate = getChargePeriodEndDate
exports.getChargePeriodStartDate = getChargePeriodStartDate
exports.getChargePeriod = getChargePeriod
exports.isNaldTransaction = isNaldTransaction
