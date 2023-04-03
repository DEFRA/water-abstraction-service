'use strict'

const moment = require('moment')
const abstractionHelpers = require('@envage/water-abstraction-helpers')

const { mapQuantity, mapUnit, getStartDate, mapUsability } = abstractionHelpers.returns.mappers

/**
 * Maps a row of data from NALD to a fake line row in the new returns service
 * @param {Object} returnRow - a row from the local returns table
 * @param {Object} line - a row from the NALD_RET_LINES import table
 * @return {Object}
 */
const naldToReturnLine = (returnRow, line) => {
  const startDate = getStartDate(returnRow.start_date, line.RET_DATE, returnRow.returns_frequency)
  const endDate = moment(line.RET_DATE, 'YYYYMMDDHHmmss').format('YYYY-MM-DD')
  const lineId = `${returnRow.return_id}:${endDate}`
  const { ARFL_ARTY_ID, ARFL_DATE_FROM, RET_DATE } = line

  return {
    line_id: lineId,
    start_date: startDate,
    end_date: moment(line.RET_DATE, 'YYYYMMDDHHmmss').format('YYYY-MM-DD'),
    quantity: mapQuantity(line.RET_QTY),
    unit: 'm³',
    user_unit: mapUnit(line.UNIT_RET_FLAG),
    reading_type: mapUsability(line.RET_QTY_USABILITY),
    time_period: returnRow.returns_frequency,
    metadata: {
      version: 1,
      nald: { ARFL_ARTY_ID, ARFL_DATE_FROM, RET_DATE }
    }
  }
}

/**
 * For weekly returns, looks through the years lines data and finds the
 * day most commonly used for entries
 * @param {Array} lines
 * @return {Number} day of week
 */
const getWeekdayHistogram = (lines) => {
  const initial = {
    0: { day: 0, freq: 0 },
    1: { day: 1, freq: 0 },
    2: { day: 2, freq: 0 },
    3: { day: 3, freq: 0 },
    4: { day: 4, freq: 0 },
    5: { day: 5, freq: 0 },
    6: { day: 6, freq: 0 }
  }

  const days = lines.reduce((acc, line) => {
    if (line.quantity !== null) {
      const day = moment(line.end_date).day()
      acc[day].freq++
    }
    return acc
  }, initial)

  const daysArr = Object.values(days)
  let max = null
  if (daysArr.length > 0) {
    max = daysArr.reduce((prev, curr) => prev.freq > curr.freq ? prev : curr)
  }

  return max.day
}

/**
 * For weekly returns, we wish to filter out irrelevant daily null values
 * @param {Object} returnRow - row from the returns table
 * @param {Array} lines - synthesised line data
 * @return {Array} data with irrelevant lines removed
 */
const filterWeeklyRows = (returnRow, lines) => {
  const dayOfWeek = getWeekdayHistogram(lines)

  return lines.filter(row => {
    return moment(row.end_date, 'YYYY-MM-DD').day() === dayOfWeek || row.quantity !== null
  })
}

/**
 * Process line data
 * @param {Object} returnRow - row from the returns table
 * @param {Array} lines - NALD_RET_LINES data
 * @return {Array} data with irrelevant lines removed
 */
const naldToReturnLines = (returnRow, lines) => {
  const data = lines.map(row => (naldToReturnLine(returnRow, row)))

  if (returnRow.returns_frequency === 'week') {
    return filterWeeklyRows(returnRow, data)
  }

  return data
}

module.exports = {
  naldToReturnLines
}
