'use strict'

const DateRange = require('../models/date-range')
const ReturnLine = require('../models/return-line')

/**
 * Maps a return line from the returns service to a water service model
 * @param {Object} row - from returns service
 * @return {ReturnLine} service model
 */
const returnsServiceToModel = (row) => {
  const line = new ReturnLine()
  return line.fromHash({
    id: row.line_id,
    dateRange: new DateRange(row.start_date, row.end_date),
    volume: row.quantity,
    timePeriod: row.time_period
  })
}

exports.returnsServiceToModel = returnsServiceToModel
