'use strict'

const AbstractionPeriod = require('../models/abstraction-period')
const Return = require('../models/return')
const DateRange = require('../models/date-range')
const { transformNull } = require('@envage/water-abstraction-helpers').nald

/**
 * Maps data from the `nald` property of the returns metadata to either an
 * AbstractionPeriod service model or null
 * @param {Object} nald data from the "nald" property of returns.returns.metadata
 * @return {AbstractionPeriod|null}
 */
const mapAbsPeriod = ({ periodStartDay, periodStartMonth, periodEndDay, periodEndMonth }) => {
  const values = [periodStartDay, periodStartMonth, periodEndDay, periodEndMonth]
  if (values.includes(null)) {
    return null
  }
  return new AbstractionPeriod().fromHash({
    startDay: periodStartDay,
    startMonth: periodStartMonth,
    endDay: periodEndDay,
    endMonth: periodEndMonth
  })
}

const returnsServiceToModel = (ret, returnRequirement) => {
  const nald = transformNull(ret.metadata.nald)

  const r = new Return(ret.return_id)
  r.fromHash({
    dateRange: new DateRange(ret.start_date, ret.end_date),
    isUnderQuery: ret.under_query,
    isSummer: ret.metadata.isSummer ? ret.metadata.isSummer : false,
    dueDate: ret.due_date,
    receivedDate: ret.received_date,
    status: ret.status,
    abstractionPeriod: mapAbsPeriod(nald)
  })

  if (returnRequirement) {
    r.returnRequirement = returnRequirement
  }
  return r
}

exports.returnsServiceToModel = returnsServiceToModel
