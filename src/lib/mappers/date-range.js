'use strict'
const DateRange = require('../models/date-range')

/**
 * Maps a plain object representation of a date range to
 * a DateRange service model
 * @param {Object} dateRange
 * @return {DateRange}
 */
const pojoToModel = dateRange => {
  if (!dateRange) {
    return null
  }
  return new DateRange(dateRange.startDate, dateRange.endDate)
}

exports.pojoToModel = pojoToModel
