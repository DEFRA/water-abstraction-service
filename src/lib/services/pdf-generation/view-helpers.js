'use strict'

const moment = require('moment')
const { chunk } = require('lodash')
const naldDates = require('@envage/water-abstraction-helpers').nald.dates

const naldRegions = require('./data/nald-regions')
const naldAreas = require('./data/nald-areas')

/**
 * Outputs the region name given the NALD region code
 * @param {Number} code
 * @return {String}
 */
const naldRegion = code => naldRegions[parseInt(code)]

const naldArea = code => naldAreas[code]

/**
 * Formats date using specified moment format string
 * @param {String} dateStr - the date string
 * @param {String} format - the moment date format
 * @return {String} formatted date
 */
const dateFormat = (dateStr, format = 'D MMMM YYYY') => {
  return moment(dateStr).format(format)
}

/**
 * Takes an array of data items and return an array representing pages
 * of data, each then containing columns and items
 */
const chunkPages = (data, itemsPerColumn, columnsPerPage) => {
  const columns = chunk(data, itemsPerColumn).map(arr => ({ items: arr }))
  const pages = chunk(columns, columnsPerPage).map(arr => ({ columns: arr }))
  return pages
}

const paginateDailyReturnLines = (startDate, endDate) => {
  const months = []
  const datePtr = moment(startDate)
  const end = moment(endDate).endOf('month')

  do {
    months.push({
      days: datePtr.daysInMonth(),
      label: datePtr.format('MMMM YYYY')
    })
    datePtr.add(1, 'month')
  } while (datePtr.isSameOrBefore(end))

  return chunkPages(months, 1, 3)
}

const paginateWeeklyReturnLines = (startDate, endDate) => {
  const datePtr = naldDates.getWeek(startDate).end
  const end = naldDates.getWeek(endDate).end
  const dates = []
  do {
    dates.push({ label: datePtr.format('D MMMM YYYY') })
    datePtr.add(1, 'week')
  } while (datePtr.isSameOrBefore(end))

  return chunkPages(dates, 14, 2)
}

const paginateMonthlyReturnLines = (startDate, endDate) => {
  const months = []
  const datePtr = moment(startDate).endOf('month')
  const end = moment(endDate).endOf('month')

  do {
    months.push({ label: datePtr.format('D MMMM YYYY') })
    datePtr.add(1, 'month').endOf('month')
  } while (datePtr.isSameOrBefore(end))

  return chunkPages(months, 12, 2)
}

const paginateReturnLines = (personalisation) => {
  moment.locale('en-gb')
  const paginators = {
    day: paginateDailyReturnLines,
    week: paginateWeeklyReturnLines,
    month: paginateMonthlyReturnLines
  }
  const {
    returns_frequency: returnsFrequency,
    start_date: startDate,
    end_date: endDate
  } = personalisation

  return paginators[returnsFrequency](startDate, endDate)
}

const stringify = obj => JSON.stringify(obj, null, 2)

exports.naldRegion = naldRegion
exports.naldArea = naldArea
exports.dateFormat = dateFormat
exports.paginateReturnLines = paginateReturnLines
exports.stringify = stringify
