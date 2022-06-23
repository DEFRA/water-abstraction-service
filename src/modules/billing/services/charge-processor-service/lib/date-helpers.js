'use strict'

const MomentRange = require('moment-range')
const moment = MomentRange.extendMoment(require('moment'))

const DATE_FORMAT = 'YYYY-MM-DD'

/**
 * The date range splitter function from water-abstraction-helpers
 * writes new dates to the supplied objects as
 * effectiveStartDate and effectiveEndDate
 * This function moves these to startDate and endDate so it can
 * be run through the date splitter again.
 * The original start/end dates are moved to originalStartDate and originalEndDate
 * @param {Object} obj
 * @return {Object}
 */
const applyEffectiveDates = obj => ({
  ...obj,
  startDate: moment(obj.effectiveStartDate).format(DATE_FORMAT),
  endDate: moment(obj.effectiveEndDate).format(DATE_FORMAT),
  originalStartDate: obj.startDate,
  originalEndDate: obj.endDate
})

const findByDate = (arr, date) => {
  const m = moment(date)
  return arr.find(row => {
    const range = moment.range(row.startDate, row.endDate)
    return range.contains(m)
  })
}

exports.applyEffectiveDates = applyEffectiveDates
exports.findByDate = findByDate
